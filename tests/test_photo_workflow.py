import hashlib,importlib.util,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
import photo_book_workflow as flow
from contribute_evals import publish,validate_payload
from llm_judge import blocking_findings
class PhotoWorkflow(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.photos=self.root/'photos';self.photos.mkdir()
  for n in [10,2]:Image.new('RGB',(200,150),(n,120,130)).save(self.photos/f'page-{n}.jpg')
  self.patcher=patch.multiple(flow,ROOT=self.root,EVAL=self.root/'data/local/script-evals',PRODUCTION=self.root/'data/local/review-production');self.patcher.start()
  with patch.object(flow,'create_structured_response',side_effect=AssertionError('prepare must be offline')):
   self.folder=flow.prepare(self.photos,'test-book','Local fixture','小朋友',29,'white-2d',output=self.root/'data/local/books/test-book')
 def tearDown(self):self.patcher.stop();self.temp.cleanup()
 def draft(self):
  b=flow.read(self.folder/'book.json');s=flow.read(self.folder/'source.json')
  for p,e in zip(b['pages'],s['pages']):
   e['printedEvidence']='Locked test text';e['visibleEvidence']='A synthetic test shape';p.update(story=e['printedEvidence'],narration={'zh-CN':'独立测试译文'},invitation='看看这个图形，你看到了吗？'+p['pageId'],response='可以指给我看。');p['visualPlan']['description']='A test shape';(self.folder/'assets'/(p['pageId']+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"><circle cx="100" cy="100" r="50" fill="#ded1c4"/></svg>')
  flow.put(self.folder/'book.json',b);flow.put(self.folder/'source.json',s);flow.publish_review(self.folder)
 def library(self):
  spec=importlib.util.spec_from_file_location('eval_fixture_server',ROOT/'evals/webapp/serve.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m.ReviewLibrary(flow.EVAL,flow.EVAL/'ratings.sqlite3',[self.root/'data/local/source-pdfs'])
 def pass_reviews(self):
  lib=self.library()
  for p in lib.catalog()['books'][0]['versions'][-1]['pages']:
   lib.save({'key':p['key'],'ratings':[{'kind':'script','revision':p['scriptRevision'],'score':5,'comment':'Test parent approval'},{'kind':'visual','revision':p['visualRevision'],'score':1,'comment':''}]})
 def test_prepare_keeps_private_profile_and_natural_photo_order_without_api(self):
  b=flow.read(self.folder/'book.json');s=flow.read(self.folder/'source.json');self.assertEqual(b['childProfile']['ageMonths'],29);self.assertEqual(b['preferredCompanion'],'white-2d');self.assertEqual(s['pages'][0]['originalSha256'],hashlib.sha256((self.photos/'page-2.jpg').read_bytes()).hexdigest());self.assertFalse((self.folder/'audio').exists())
 def test_build_transcribes_before_authoring_and_publishes_parent_review_without_voice(self):
  def authored(folder,pid,*args):
   b=flow.read(folder/'book.json');source=flow.read(folder/'source.json');p=next(p for p in b['pages'] if p['pageId']==pid);e=next(e for e in source['pages'] if e['pageId']==pid)
   self.assertEqual(p['story'],'Locked photo text');self.assertEqual(e['transcriptionStatus'],'AI-transcribed; parent review required');self.assertEqual(b['childProfile']['ageMonths'],29)
   p.update(narration={'zh-CN':'测试译文'},invitation='看看这个图形。'+pid,response='一起看看吧。');p['visualPlan']['description']='Synthetic shape';flow.put(folder/'book.json',b);(folder/'assets'/(pid+'.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720"><circle cx="100" cy="100" r="50" fill="#ded1c4"/></svg>')
  with patch.object(flow,'create_structured_response',return_value=({'printedEvidence':'Locked photo text','visibleEvidence':'Synthetic shape','uncertainty':'Check the cropped edge'},{})),patch.object(flow,'generate',side_effect=authored),patch.object(flow.subprocess,'run') as process:
   self.assertEqual(flow.build(self.folder,'configured-model','configured-visual-model'),'v1');process.assert_not_called()
  self.assertEqual(flow.read(self.folder/'workflow.json')['phase'],'awaiting-parent-review');self.assertTrue(flow.read(self.folder/'book.json')['reviewNotes']);self.assertFalse((self.folder/'audio').exists())
 def test_voice_cannot_start_before_parent_reviews(self):
  self.draft()
  with patch.object(flow.subprocess,'run') as run:
   with self.assertRaisesRegex(ValueError,'parent review'):flow.finish_voice(self.folder,Path('/unused-lab'))
   run.assert_not_called()
 def test_current_parent_reviews_pass_but_changed_translation_or_svg_blocks_voice(self):
  self.draft();self.pass_reviews();self.assertEqual(flow.review_ready(self.folder)['pages'],2)
  b=flow.read(self.folder/'book.json');b['pages'][0]['narration']['zh-CN']='Changed translation';flow.put(self.folder/'book.json',b)
  with self.assertRaisesRegex(ValueError,'script'):flow.review_ready(self.folder)
  b['pages'][0]['narration']['zh-CN']='独立测试译文';flow.put(self.folder/'book.json',b)
  asset=self.folder/'assets/p001.svg';asset.write_text(asset.read_text().replace('r="50"','r="60"'))
  with self.assertRaisesRegex(ValueError,'visual changed'):flow.review_ready(self.folder)
 def test_new_round_retains_identical_dimensions_but_changed_script_requires_review(self):
  self.draft();self.pass_reviews();self.assertEqual(flow.publish_review(self.folder),'v2');self.assertEqual(flow.review_ready(self.folder)['pages'],2)
  lib=self.library();page=lib.catalog()['books'][0]['versions'][-1]['pages'][0];self.assertIn('inheritedFrom',page['review'])
  b=flow.read(self.folder/'book.json');b['pages'][0]['invitation']='新的邀请，看看这个图形。';flow.put(self.folder/'book.json',b);flow.publish_review(self.folder)
  page=lib.catalog()['books'][0]['versions'][-1]['pages'][0];self.assertIsNone(page['review']);self.assertEqual(page['visualReview']['score'],1)
  with self.assertRaisesRegex(ValueError,'parent review'):flow.review_ready(self.folder)
 def test_contribution_requires_consent_to_exact_payload_before_network(self):
  raw=(ROOT/'evals/contributions/maintainer-feedback-v1.json').read_bytes();payload=self.root/'feedback.json';payload.write_bytes(raw);approval=self.root/'approval.json';approval.write_text(json.dumps({'approved':True,'sha256':'different-hash','repository':'susiefan/Read-for-Xixi','license':'MIT'}))
  with patch('contribute_evals.subprocess.run') as run:
   with self.assertRaisesRegex(ValueError,'Parent approval'):publish(payload,approval)
   run.assert_not_called()
  data=json.loads(raw);data['records'][0]['childName']='Private';self.assertRaises(ValueError,validate_payload,data)
 def test_judge_preferences_do_not_override_accepted_work(self):
  result={'scriptScore':3,'visualPass':True,'findings':[{'scope':'script','level':'suggestion','message':'I prefer another valid wording'}]};self.assertEqual(blocking_findings(result),[])
  result['findings'].append({'scope':'visual','level':'blocking','message':'Tree floats outside its pot'});self.assertEqual(blocking_findings(result,'script'),[]);self.assertEqual(len(blocking_findings(result,'visual')),1)
if __name__=='__main__':unittest.main()
