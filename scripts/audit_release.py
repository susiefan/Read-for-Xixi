"""Scan the exact tracked + eligible new files before publishing source.

Ignored local books, feedback and generated output are never scanned into a
publication manifest. Report paths and hashes, never credential values.
"""
from pathlib import Path
import argparse,hashlib,json,re,shutil,subprocess
ROOT=Path(__file__).resolve().parents[1]
KEY=re.compile(rb'(?:sk-proj-[A-Za-z0-9_-]{30,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)')
FORBIDDEN=('data/local/','public/library/','examples/books/','.env','node_modules/','.venv/','dist/')
def audit(root=ROOT):
 git=shutil.which('git')
 names=subprocess.check_output([git,'ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0')
 findings=[];manifest=[]
 for name in sorted(set(names)-{''}):
  path=root/name
  if not path.is_file():continue
  if name.startswith(FORBIDDEN) and name!='.env.example':findings.append({'path':name,'reason':'private/generated path eligible for publication'})
  if path.is_symlink():findings.append({'path':name,'reason':'symlink'})
  data=path.read_bytes()
  if KEY.search(data):findings.append({'path':name,'reason':'credential-like content'})
  if len(data)>25_000_000:findings.append({'path':name,'reason':'large binary needs explicit publication review'})
  manifest.append({'path':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
 report={'status':'pass' if not findings else 'fail','findings':findings,'fileCount':len(manifest),'files':manifest,'scope':'Git eligible files only; local books and unconsented private feedback excluded'}
 return report
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path);a=p.parse_args();r=audit()
 if a.output:a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in r.items() if k!='files'},ensure_ascii=False,indent=2));raise SystemExit(0 if r['status']=='pass' else 1)
