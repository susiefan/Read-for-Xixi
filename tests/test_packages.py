import copy,importlib.util,json,shutil,sys,tempfile,unittest,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'));sys.path.insert(0,str(ROOT/'evals'))
import book_package as package
from review_loop import plan
from live2d_quality import split_findings,inspect_svg
class Packages(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.book=self.root/'book';self.book.mkdir()
  # Structural fixture only: not a new illustrated book or production-library item.
  pdf=b'%PDF-1.0\nTest package bytes for hash verification\n';(self.book/'fixture.pdf').write_bytes(pdf)
  import hashlib
  page={'pageId':'p01','label':'Schema fixture','story':'Locked source string','narration':{'zh-CN':'Independent translation field'},'invitation':'Required invitation field','response':'Required response field','visualPlan':{'sourcePageId':'p01','theme':'room','description':'Structural fixture','palette':['#112233','#aabbcc'],'motifs':['circle']}}
  book={'schemaVersion':'1.0','id':'test-fixture','title':'Schema fixture','localized':{k:{'title':'Fixture','description':'Not a production book'} for k in ('zh-CN','en')},'intro':'Test','language':'zh-CN','ageMonths':24,'sourcePdf':'fixture.pdf','license':{'spdx':'MIT','url':'https://example.invalid/license','source':'https://example.invalid/fixture','creators':['Test author'],'changes':'Synthetic test fields'},'pages':[page]}
  source={'bookId':'test-fixture','sourcePdf':'fixture.pdf','sha256':hashlib.sha256(pdf).hexdigest(),'pages':[{'pageId':'p01','pdfPage':1,'printedEvidence':page['story'],'visibleEvidence':'Structural fixture only'}]}
  for name,value in [('book.json',book),('source.json',source)]:(self.book/name).write_text(json.dumps(value))
  (self.book/'assets').mkdir();(self.book/'assets/p01.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"><circle cx="60" cy="60" r="20" fill="#aabbcc"/></svg>')
 def tearDown(self):self.temp.cleanup()
 def test_roundtrip(self):
  archive=self.root/'book.zip';package.export(self.book,archive);package.install(archive,self.root/'imported');self.assertEqual(package.validate(self.root/'imported')['pages'],1)
 def test_original_locked_but_translation_editable(self):
  book=json.loads((self.book/'book.json').read_text());book['pages'][0]['narration']['zh-CN']='小老鼠找房子。';(self.book/'book.json').write_text(json.dumps(book));package.validate(self.book)
  book['pages'][0]['story']='Changed original';(self.book/'book.json').write_text(json.dumps(book))
  with self.assertRaisesRegex(ValueError,'printed text'):package.validate(self.book)
 def test_path_traversal_never_escapes(self):
  archive=self.root/'bad.zip'
  with zipfile.ZipFile(archive,'w') as z:z.writestr('../escaped.txt','bad')
  with self.assertRaisesRegex(ValueError,'Unsafe'):package.install(archive,self.root/'imported')
  self.assertFalse((self.root/'escaped.txt').exists());self.assertFalse((self.root/'imported').exists())
 def test_tampered_manifest_rejected(self):
  archive=self.root/'bad.zip'
  with zipfile.ZipFile(archive,'w') as z:z.writestr('book.json','{}');z.writestr('manifest.sha256.json','{"book.json":"not-hash"}')
  with self.assertRaisesRegex(ValueError,'Hash mismatch'):package.install(archive,self.root/'imported')
 def test_review_static_files_are_distributed(self):
  for name in ['index.html','app.js','app.css','mimi.svg','open-source.html','open-source.js','open-source.css']:
   self.assertTrue((ROOT/'evals/webapp/dist'/name).is_file(),name)
 def test_rendered_asset_keeps_transparency(self):
  _,png=inspect_svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"><circle cx="100" cy="100" r="75" fill="#aabbcc"/></svg>','scene_layer')
  self.assertTrue(png.startswith(b'\x89PNG'))
 def test_active_svg_rejected(self):
  svg=self.root/'bad.svg';svg.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"><script>alert(1)</script></svg>')
  with self.assertRaisesRegex(ValueError,'unsafe SVG tag'):package.check_svg(svg)
 def test_feedback_preserves_passing_dimensions(self):
  page={'pageId':'p01','pdfPage':1,'key':'batch/book/v1/p01','review':{'score':6,'comment':'可更口语化'},'visualReview':{'score':0,'comment':'书的朝向不对'},'visualRevision':'v','reviewVisuals':{'scene':{'layers':[]}}}
  catalog={'blocked':[],'books':[{'title':'Book','versions':[{'id':'v1','pages':[page]}]}]};result=plan(catalog)
  self.assertEqual(result['targets'][0]['dimensions'],['visual']);self.assertEqual(len(result['optionalSuggestions']),1)
  page['review']=None;page['visualReview']=None;result=plan(catalog);self.assertEqual(result['targets'],[]);self.assertEqual(result['pendingScripts'],1)
 def test_preference_does_not_trigger_retry(self):
  blocking,suggestions=split_findings({'sourceMatch':{'level':'suggestion','message':'Another blue could also work'},'noSpoiler':{'level':'pass','message':''},'flatStyle':{'level':'pass','message':''},'stageFit':{'level':'pass','message':''},'physicalSupport':{'level':'pass','message':''}})
  self.assertFalse(blocking);self.assertEqual(len(suggestions),1)
if __name__=='__main__':unittest.main()
