"""Preview locally; publish a text-only eval contribution only with explicit consent.

Publishing uses the parent's authenticated GitHub account and opens a PR. It
uploads only the exact hash-approved, allowlisted feedback payload, not a book.
"""
import argparse,hashlib,json,re,subprocess,tempfile
from pathlib import Path

def validate_payload(data):
 allowed={'schemaVersion','license','provenance','excluded','limitations','records'}
 if not isinstance(data,dict) or set(data)!=allowed:raise ValueError('Only the exported feedback format is accepted')
 fields={'id','bookKey','scriptVersion','pageId','dimension','score','comment','contentRevision','reviewDate','provenance','defaultVisualPassMayHaveApplied'}
 if not isinstance(data['records'],list) or len(data['records'])>5000:raise ValueError('Too many review records')
 for r in data['records']:
  if set(r)!=fields:raise ValueError('Unexpected review field: source content or identity is not allowed')
  if r['dimension'] not in ('script','visual','legacy-overall'):raise ValueError('Unknown rating dimension')
  if type(r['score'])!=int or (r['score'] not in (0,1) if r['dimension']=='visual' else not 1<=r['score']<=7):raise ValueError('Invalid grade')
  if not isinstance(r['comment'],str) or len(r['comment'])>4000:raise ValueError('Invalid review comment')
  if re.search(r'/Users/|sk-proj-|github_pat_|ghp_|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}',r['comment']):raise ValueError('Review comment may contain identifying data or a credential')
 return data

def publish(payload,approval,repository='susiefan/Read-for-Xixi'):
 raw=Path(payload).read_bytes();data=validate_payload(json.loads(raw));digest=hashlib.sha256(raw).hexdigest();consent=json.loads(Path(approval).read_text())
 if consent.get('approved') is not True or consent.get('sha256')!=digest or consent.get('repository')!=repository or consent.get('license')!='MIT':raise ValueError('Parent approval must cover this exact payload hash, destination and MIT contribution license')
 # Isolated clone/fork: never pushes the parent's local book working directory.
 with tempfile.TemporaryDirectory(prefix='xixi-eval-contribution-') as tmp:
  clone=Path(tmp)/'repo';login=subprocess.check_output(['gh','api','user','--jq','.login'],text=True).strip()
  if repository.split('/')[0].casefold()==login.casefold():subprocess.run(['gh','repo','clone',repository],cwd=tmp,check=True)
  else:subprocess.run(['gh','repo','fork',repository,'--clone','--remote','--fork-name','Read-for-Xixi'],cwd=tmp,check=True)
  dirs=[p for p in Path(tmp).iterdir() if (p/'.git').exists()]
  if len(dirs)!=1:raise ValueError('Could not identify isolated fork clone')
  clone=dirs[0];branch='contribute/evals-'+digest[:12];subprocess.run(['git','switch','-c',branch],cwd=clone,check=True)
  target=clone/'evals/contributions'/('parent-evals-'+digest[:12]+'.json');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
  relative=target.relative_to(clone).as_posix();subprocess.run(['git','add','--',relative],cwd=clone,check=True);subprocess.run(['git','commit','-m','Contribute consented parent evaluation feedback'],cwd=clone,check=True);subprocess.run(['git','push','--set-upstream','origin',branch],cwd=clone,check=True)
  body=Path(tmp)/'pr.md';body.write_text(f'Parent-approved text-only evaluation contribution: {len(data["records"])} saved ratings.\n\nPayload SHA-256: {digest}\n\nThe parent reviewed this exact payload and consented to public contribution under MIT. Book text/scripts/scans/audio, child profiles and reviewer identity are excluded.\n')
  subprocess.run(['gh','pr','create','--repo',repository,'--title','Contribute parent evaluation feedback','--body-file',str(body)],cwd=clone,check=True)
 return {'sha256':digest,'records':len(data['records']),'published':True}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('payload',type=Path);p.add_argument('--publish',action='store_true');p.add_argument('--approval',type=Path);a=p.parse_args();data=validate_payload(json.loads(a.payload.read_text()));digest=hashlib.sha256(a.payload.read_bytes()).hexdigest()
 if a.publish:
  if not a.approval:p.error('--approval is required; preview alone never uploads')
  result=publish(a.payload,a.approval)
 else:result={'previewOnly':True,'records':len(data['records']),'sha256':digest,'approvalExample':{'approved':True,'sha256':digest,'repository':'susiefan/Read-for-Xixi','license':'MIT'},'action':'Show the actual redacted payload to the parent and ask before creating the approval file. Declining is allowed.'}
 print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
