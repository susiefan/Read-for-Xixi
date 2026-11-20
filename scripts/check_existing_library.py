"""Verify imported local books reuse existing scripts/assets/audio byte-for-byte."""
import hashlib,json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def wav_duration(path):
 raw=Path(path).read_bytes()
 if raw[:4]!=b'RIFF' or raw[8:12]!=b'WAVE':raise ValueError('Not a WAV file')
 i=12;fmt=None;size=None
 while i+8<=len(raw):
  kind,n=struct.unpack_from('<4sI',raw,i);chunk=raw[i+8:i+8+n]
  if len(chunk)!=n:raise ValueError('Truncated WAV chunk')
  if kind==b'fmt ':fmt=struct.unpack_from('<HHIIHH',chunk)
  if kind==b'data':size=n
  i+=8+n+n%2
 if not fmt or not size or fmt[0] not in (1,3,65534) or not fmt[3]:raise ValueError('Missing/unsupported WAV audio')
 duration=size/fmt[3]
 if not .1<=duration<=3600:raise ValueError('Invalid WAV duration')
 return duration

def check(root=ROOT):
 receipt=json.loads((root/'data/local/library-import.json').read_text());catalog=json.loads((root/'public/library/books.json').read_text());source=json.loads((Path(receipt['source'])/'public/local-private/books.json').read_text());results=[]
 for book in catalog['books']:
  original=next(b for b in source['books'] if b['id']==book['id']);duration=0
  for page,old in zip(book['pages'],original['pages']):
   for key in ('story','invitation','response'):
    if page[key] != (old.get(key) or old.get('shortResponse') or old.get('detailedResponse')):raise ValueError(f'{book["id"]}: accepted {key} changed')
   for url in page['audioTracks'].values():duration+=wav_duration(root/'public'/url.lstrip('/'))
  entry=next(b for b in receipt['books'] if b['id']==book['id'])
  for item in entry['files']:
   if hashlib.sha256((root/'public'/item['output'].lstrip('/')).read_bytes()).hexdigest()!=item['sha256']:raise ValueError('Copied asset changed')
  results.append({'id':book['id'],'pages':len(book['pages']),'audioTracks':len(book['pages'])*3,'audioSeconds':round(duration,2),'unchanged':True})
 return results
if __name__=='__main__':print(json.dumps(check(),ensure_ascii=False,indent=2))
