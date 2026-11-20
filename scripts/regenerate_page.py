"""Image-first, bounded page regeneration; never edits another page or printed text.

Pass --dimension script, visual or both. The source PDF image is the primary
input. Authoring owns the visual plan; the separate SVG agent renders that plan.
Only definite material critic findings trigger retries. Suggestions pass through.
No speech or human score is generated here.
"""
from __future__ import annotations
import argparse,base64,copy,hashlib,json,subprocess,tempfile
from pathlib import Path
from book_package import ROOT,read,validate,check_svg
from openai_responses import create_structured_response
from llm_judge import judge,blocking_findings

TEXT={'type':'string'}
def obj(props):return {'type':'object','properties':props,'required':list(props),'additionalProperties':False}
AUTHOR_SCHEMA=obj({'narration':TEXT,'invitation':TEXT,'response':TEXT,'visualPlan':obj({'description':TEXT,'theme':TEXT,'palette':{'type':'array','items':TEXT},'motifs':{'type':'array','items':TEXT},'motion':TEXT,'style':TEXT})})
SVG_SCHEMA=obj({'svg':TEXT,'frontSvg':TEXT})
FINDING=obj({'check':TEXT,'level':{'type':'string','enum':['pass','suggestion','blocking']},'message':TEXT})
CRITIC_SCHEMA=obj({'findings':{'type':'array','items':FINDING}})
CRITIC='''Compare the original page and candidate. Check page grounding, no spoilers,
natural Mandarin for age two, one easy invitation, no repeated answer, flat 平涂
book-matched palette, transparent 720-square scene, central reading cat reserved,
physical support and safe SVG. Blocking means a clear material error. A valid
alternative or preference is only suggestion. Do not require a response to name
the main subject; funny details, colour, quantity, feelings and everyday manners
are all useful when grounded and age appropriate. Do not reject a good answer
for failing to match your favourite wording. Never invent human grades.'''
def image_item(data,mime='image/jpeg'):
 return {'type':'input_image','image_url':f'data:{mime};base64,'+base64.b64encode(data).decode()}
def render_svg(svg):
 command=['node','--input-type=module','-e',"import {Resvg} from '@resvg/resvg-js';import fs from 'node:fs';process.stdout.write(new Resvg(fs.readFileSync(0),{font:{loadSystemFonts:false},fitTo:{mode:'width',value:720}}).render().asPng());"]
 return subprocess.run(command,input=svg.encode(),capture_output=True,check=True,cwd=ROOT).stdout

def generate(folder,page_id,dimension,model,visual_model,feedback='',attempts=3):
 import pypdfium2 as pdfium
 book=read(folder/'book.json');source=read(folder/'source.json');index=next(i for i,p in enumerate(book['pages']) if p['pageId']==page_id)
 old=copy.deepcopy(book['pages'][index]);evidence=next(p for p in source['pages'] if p['pageId']==page_id)
 with pdfium.PdfDocument(folder/book['sourcePdf']) as pdf:
  page=pdf[evidence['pdfPage']-1];bitmap=page.render(scale=1200/max(page.get_size()))
  import io
  buffer=io.BytesIO();bitmap.to_pil().convert('RGB').save(buffer,'JPEG',quality=90);scan=image_item(buffer.getvalue());bitmap.close();page.close()
 candidate=copy.deepcopy(old);asset=folder/'assets'/(page_id+'.svg');svg=asset.read_text();front_asset=folder/'assets'/(page_id+'-front.svg');front_svg=front_asset.read_text() if front_asset.exists() else '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"/>';history=[]
 for attempt in range(1,attempts+1):
  if 'TODO' in evidence['visibleEvidence']:
   evidence['visibleEvidence']='Describe the visible page directly from the supplied image.'
  context={'job':'Regenerate ONLY the requested dimensions for this page.','pageId':page_id,'printedText':evidence['printedEvidence'],'visibleEvidence':evidence['visibleEvidence'],'earlierPages':[p['story'] for p in book['pages'][:index]],'previous':candidate,'feedback':feedback,'blockingFindings':history[-1]['blocking'] if history else [],'dimension':dimension,'childProfile':book.get('childProfile',{'ageMonths':book.get('ageMonths',24)})}
  if dimension in ('script','both'):
   authored,_=create_structured_response(model=model,input_items=[{'role':'system','content':(ROOT/'prompts/authoring.md').read_text()+'\nReturn a separate faithful Mandarin narration; printedText is locked. Return one invitation, one response, and a source-grounded visual plan together. No separate brief.'},{'role':'user','content':[{'type':'input_text','text':json.dumps(context,ensure_ascii=False)},scan]}],schema_name='page_author',schema=AUTHOR_SCHEMA)
   candidate.update(narration={'zh-CN':authored['narration']},invitation=authored['invitation'],response=authored['response'],visualPlan=authored['visualPlan']|{'sourcePageId':page_id})
  if dimension=='script':candidate['visualPlan']=old['visualPlan']
  if dimension in ('visual','both'):
   reference_art=(folder/'avatar-reference.svg').read_text() if (folder/'avatar-reference.svg').exists() else (ROOT/'evals/webapp/dist/mimi.svg').read_text()
   reference=render_svg(reference_art)
   generated,_=create_structured_response(model=visual_model,input_items=[{'role':'system','content':(ROOT/'prompts/visual-assets.md').read_text()+'\nReturn two transparent SVG strings: svg for scenery behind the companion, frontSvg for foreground/held/worn props over it (empty transparent SVG if none). Plan scenery and meaningful props together. Keep the source cat itself out of both. Head/paw contact must fit the supplied companion reference. Use only svg,title,g,path,rect,ellipse,circle,line,polyline,polygon,defs,clipPath. No text, scripts, links, raster images, foreignObject, filters or gradients. viewBox 0 0 720 720. Main companion stays outside the generated SVG. The second image is the companion style reference. Critic findings: '+json.dumps(history[-1]['blocking'] if history else [])},{'role':'user','content':[{'type':'input_text','text':json.dumps({'plan':candidate['visualPlan'],'feedback':feedback},ensure_ascii=False)},scan,image_item(reference,'image/png')]}],schema_name='page_svg',schema=SVG_SCHEMA)
   svg=generated['svg'];front_svg=generated['frontSvg']
  blocking=[]
  try:
   with tempfile.TemporaryDirectory() as tmp:
    tmp_svg=Path(tmp)/'candidate.svg';tmp_svg.write_text(svg);check_svg(tmp_svg);tmp_svg.write_text(front_svg);check_svg(tmp_svg)
   if not candidate['invitation'].strip() or not candidate['response'].strip():raise ValueError('Missing mandatory interaction')
   from xml.etree import ElementTree as ET
   stage=ET.Element('{http://www.w3.org/2000/svg}svg',{'viewBox':'0 0 720 720'})
   for layer in [svg,(folder/'avatar-reference.svg').read_text() if (folder/'avatar-reference.svg').exists() else (ROOT/'evals/webapp/dist/mimi.svg').read_text(),front_svg]:
    layer_root=ET.fromstring(layer)
    for node in list(layer_root):stage.append(node)
   preview=image_item(render_svg(ET.tostring(stage,encoding='unicode')),'image/png')
   judged=judge(model,[{'type':'input_text','text':json.dumps({'page':candidate,'childProfile':book.get('childProfile',{'ageMonths':book.get('ageMonths',24)}),'source':evidence},ensure_ascii=False)},scan,preview],dimension)
   blocking=blocking_findings(judged,dimension)
  except (ValueError,subprocess.CalledProcessError) as error:
   judged={'findings':[]};blocking=[{'check':'structural','level':'blocking','message':str(error)}]
  history.append({'attempt':attempt,'scriptScore':judged.get('scriptScore'),'visualPass':judged.get('visualPass'),'blocking':blocking,'suggestions':[f for f in judged['findings'] if f['level']=='suggestion']})
  if not blocking:break
 # Never overwrite an accepted version when the bounded loop fails.
 job=ROOT/'data/local/regeneration'/book['id']/page_id;job.mkdir(parents=True,exist_ok=True)
 report={'provenance':'AI critic, not human evaluation','dimension':dimension,'history':history,'accepted':not blocking,'candidate':candidate,'candidateSvg':svg,'candidateFrontSvg':front_svg}
 (job/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 if blocking:raise ValueError('Loop reached its limit; candidate saved only to local report, accepted book unchanged')
 if dimension=='visual':candidate=old
 candidate['story']=evidence['printedEvidence'];book['pages'][index]=candidate
 # Validate staged package before any accepted files are touched.
 with tempfile.TemporaryDirectory() as tmp:
  import shutil
  staged=Path(tmp)/'package';shutil.copytree(folder,staged)
  (staged/'book.json').write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n')
  (staged/'assets'/(page_id+'.svg')).write_text(svg)
  (staged/'assets'/(page_id+'-front.svg')).write_text(front_svg)
  validate(staged,allow_draft=True)
 (folder/'book.json').write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n')
 if dimension in ('visual','both'):
  asset.write_text(svg);front_asset.write_text(front_svg)
 return report

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);p.add_argument('page_id');p.add_argument('--dimension',choices=['script','visual','both'],required=True);p.add_argument('--model',required=True);p.add_argument('--visual-model');p.add_argument('--feedback',default='');p.add_argument('--attempts',type=int,default=3);a=p.parse_args()
 if not 1<=a.attempts<=3:p.error('attempts must be 1–3')
 print(json.dumps(generate(a.folder,a.page_id,a.dimension,a.model,a.visual_model or a.model,a.feedback,a.attempts),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
