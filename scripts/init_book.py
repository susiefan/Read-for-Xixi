"""Scaffold a licensed local PDF for image-first authoring (no API call).

Extracted text is provisional. Inspect source.json against the PDF and correct
its page-level printedEvidence BEFORE generation. Keep the source PDF immutable;
translations go in narration.zh-CN. --pages selects one-based PDF reading order.
"""
import argparse,hashlib,json,shutil
from pathlib import Path
from book_package import ID

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('pdf',type=Path);p.add_argument('destination',type=Path);p.add_argument('--id',required=True);p.add_argument('--title',required=True);p.add_argument('--source-url',required=True);p.add_argument('--license-url',required=True);p.add_argument('--license',required=True);p.add_argument('--creator',action='append',required=True);p.add_argument('--pages',required=True,help='One-based PDF pages, comma separated, e.g. 1,5,6,7');a=p.parse_args()
 if not ID.fullmatch(a.id):p.error('Invalid book ID')
 if a.destination.exists():p.error('Destination already exists')
 import pypdfium2 as pdfium
 document=pdfium.PdfDocument(a.pdf);numbers=[int(n) for n in a.pages.split(',')]
 if len(numbers)!=len(set(numbers)) or any(n<1 or n>len(document) for n in numbers):p.error('Invalid or duplicate page number')
 a.destination.mkdir(parents=True);pdfname=a.id+'.pdf';shutil.copy2(a.pdf,a.destination/pdfname)
 source={'bookId':a.id,'sourcePdf':pdfname,'sha256':hashlib.sha256(a.pdf.read_bytes()).hexdigest(),'provenance':'PDF text extraction; NOT YET verified against page images','pdfPageCount':len(document),'pages':[],'excludedPages':[{'pdfPage':n,'reason':'Excluded by input reading order'} for n in range(1,len(document)+1) if n not in numbers]}
 book={'schemaVersion':'1.0','id':a.id,'title':a.title,'localized':{lang:{'title':a.title,'description':a.title} for lang in ('zh-CN','en')},'intro':'你好，我是 Mimi。我们来读这本书。','description':a.title,'language':'zh-CN','ageMonths':24,'sourcePdf':pdfname,'license':{'spdx':a.license,'url':a.license_url,'source':a.source_url,'creators':a.creator,'changes':'Local shared-reading adaptation; exact original text retained separately.'},'setting':'study','status':'草稿','audioBase':'/audio/'+a.id,'pages':[]}
 assets=a.destination/'assets';assets.mkdir()
 for n in numbers:
  pid=f'p{n:02d}';text=document[n-1].get_textpage().get_text_range().replace('\r\n','\n').strip();source['pages'].append({'pageId':pid,'pdfPage':n,'printedEvidence':text,'visibleEvidence':'TODO: inspect source page image'})
  book['pages'].append({'pageId':pid,'label':f'PDF 第 {n} 页','story':text,'narration':{'zh-CN':'待创作'},'invitation':'待创作','response':'待创作','visualPlan':{'sourcePageId':pid,'theme':'room','description':'待创作','motifs':['draft'],'palette':['#ded1c4','#b6a18e'],'motion':'none','style':'平涂、透明 SVG、720×720'}})
  (assets/(pid+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"><title>Unfinished draft</title></svg>\n')
 for name,value in [('book.json',book),('source.json',source)]: (a.destination/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
 print('Scaffold only. Verify source.json, then run regenerate_page.py with --dimension both for each page. Drafts are blocked from export/audio until all TODOs are replaced.')
if __name__=='__main__':main()
