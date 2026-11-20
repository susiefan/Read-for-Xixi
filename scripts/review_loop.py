"""Export actual review feedback and a dimension-specific regeneration plan.

Passing (>=4/7) scripts and passed visuals are preserved. Pending is pending,
not failure. Passing comments become optional prompt suggestions. Reviews are
revision-bound by the eval server; a visual-only edit cannot erase script scores.
"""
import argparse,importlib.util,json
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('eval_server',ROOT/'evals/webapp/serve.py');server=importlib.util.module_from_spec(spec);spec.loader.exec_module(server)
def plan(catalog):
 feedback=server.feedback(catalog);targets={}
 for kind,key in [('script','belowBar'),('visual','visualFailed')]:
  for item in feedback[key]:
   page=targets.setdefault(item['key'],{'key':item['key'],'pageId':item['pageId'],'dimensions':[],'comments':[]});page['dimensions'].append(kind);page['comments'].append(item['comment'])
 return {'provenance':'saved human ratings only','passScore':4,'targets':list(targets.values()),'optionalSuggestions':feedback['passingComments']+feedback['visualPassingComments'],'pendingScripts':feedback['pending'],'pendingVisuals':feedback['visualPending']}
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--data',type=Path,default=server.DEFAULT_DATA);p.add_argument('--output',type=Path,default=ROOT/'data/local/revision-plan.json');a=p.parse_args()
 library=server.ReviewLibrary(a.data,a.data/'ratings.sqlite3',server.SOURCE_DIRS);result=plan(library.catalog());a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 archive=ROOT/'data/local/eval-feedback';archive.mkdir(parents=True,exist_ok=True)
 stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
 (archive/(stamp+'.md')).write_text('# 真实评审反馈与定向重做计划\n\n```json\n'+json.dumps(result,ensure_ascii=False,indent=2)+'\n```\n')
 print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
