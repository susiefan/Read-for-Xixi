"""Reuse selected, already-produced local books. Does not author or synthesize.

Full text, scans, SVGs, audio and human reviews stay in ignored local output.
The public repository contains only this importer and selected IDs/metadata.
"""
from __future__ import annotations
import argparse,copy,hashlib,json,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def dump(path,value):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def import_library(library_root,source_dirs=()):
 library_root=library_root.resolve();original=library_root/'public';data=json.loads((original/'local-private/books.json').read_text());selected=json.loads((ROOT/'examples/library-selection.json').read_text())['books'];books=[];receipts=[]
 for selection in selected:
  source_book=next(b for b in data['books'] if b['id']==selection['id']);book=copy.deepcopy(source_book)
  bid=book['id'];out=ROOT/'public/library'/bid;out.mkdir(parents=True,exist_ok=True);base='/library/'+bid
  source_file=next((library_root/'data/local/script-evals').glob('*/'+selection['draft']+'/source.json'))
  evidence=json.loads(source_file.read_text());candidates=[*source_dirs,library_root.parent/'storyspark book pages/bo xi he pi pu full']
  pdf_path=next((Path(p)/Path(evidence['sourcePdf']).name for p in candidates if (Path(p)/Path(evidence['sourcePdf']).name).is_file()),None)
  if pdf_path is None:raise FileNotFoundError('Source PDF missing; add --source-dir')
  if len(evidence['pages'])!=len(book['pages']):raise ValueError('Existing source/script page counts differ')
  import pypdfium2 as pdfium
  pdf=pdfium.PdfDocument(pdf_path);files=[]
  def reuse(url):
   from urllib.parse import urlsplit
   if urlsplit(url).scheme or not url.startswith('/') or '..' in Path(url).parts:raise ValueError('Unsafe existing asset path')
   path=original/url.lstrip('/')
   if not path.resolve().is_relative_to(original.resolve()) or not path.is_file():raise FileNotFoundError(url)
   digest=hashlib.sha256(path.read_bytes()).hexdigest();name=digest[:12]+'-'+path.name;target=out/'assets'/name;target.parent.mkdir(exist_ok=True);shutil.copy2(path,target);files.append({'source':url,'sha256':digest,'output':base+'/assets/'+name});return base+'/assets/'+name
  for i,(page,source) in enumerate(zip(book['pages'],evidence['pages'])):
   # Existing approved strings and zero-based track filenames remain untouched.
   if page['story']!=source['printedEvidence']:raise ValueError(f'Existing printed text differs on page {i}: verify the current accepted version')
   image=out/f'page-{i}.jpg';p=pdf[source['pdfPage']-1];bitmap=p.render(scale=1100/max(p.get_size()));bitmap.to_pil().convert('RGB').save(image,quality=88);bitmap.close();p.close()
   page['image']=base+'/'+image.name;page['narration']={'zh-CN':page['story']};page['audioTracks']={}
   page['response']=page.get('response') or page.get('shortResponse') or page.get('detailedResponse')
   for kind in ('story','invitation','response'):
    original_kind='short' if kind=='response' and not source_book['pages'][i].get('response') else kind
    path=original/source_book['audioBase'].lstrip('/')/f'spread-{i}-{original_kind}.wav'
    if not path.is_file():raise FileNotFoundError(path)
    target=out/'audio'/path.name;target.parent.mkdir(exist_ok=True);shutil.copy2(path,target);page['audioTracks'][kind]=base+'/audio/'+path.name
    files.append({'source':source_book['audioBase']+'/'+path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'output':page['audioTracks'][kind]})
   for layer in page.get('readingScene',{}).get('layers',[]):layer['url']=reuse(layer['url'])
   if page.get('visualAsset',{}):page['visualAsset']['url']=reuse(page['visualAsset']['url'])
  pdf.close();book['audioBase']=base+'/audio';book['cover']=book['pages'][0]['image'];book['localized']={'zh-CN':{'title':book['title'],'description':book['description']},'en':selection['en']}
  book['license']={'source':'','url':'','creators':[],'redistribution':'not-authorized-local-only'}
  books.append(book)
  # Copy only the selected existing review inputs; never generate new scripts or ratings.
  target=ROOT/'data/local/script-evals/existing-library'/selection['draft']
  shutil.copytree(source_file.parent,target,dirs_exist_ok=True)
  scan_dir=ROOT/'data/local/source-pdfs';scan_dir.mkdir(parents=True,exist_ok=True);shutil.copy2(pdf_path,scan_dir/pdf_path.name)
  receipts.append({'id':bid,'pages':len(book['pages']),'audioTracks':len(book['pages'])*3,'files':files,'sourceScriptSha256':hashlib.sha256(json.dumps(source_book,ensure_ascii=False,sort_keys=True).encode()).hexdigest(),'generatedNewContent':False})
 dump(ROOT/'public/library/books.json',{'schemaVersion':'1.0','books':books});dump(ROOT/'data/local/library-import.json',{'source':str(library_root),'books':receipts})
 return [{'id':b['id'],'pages':len(b['pages']),'audioTracks':len(b['pages'])*3} for b in books]
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('library_root',type=Path);p.add_argument('--source-dir',type=Path,action='append',default=[]);a=p.parse_args();print(json.dumps(import_library(a.library_root,a.source_dir),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
