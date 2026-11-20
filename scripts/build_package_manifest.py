"""Create exact speech tracks from an accepted local package, without an LLM."""
import argparse,hashlib,json
from pathlib import Path
from book_package import validate

def build(folder):
 validate(folder);book=json.loads((folder/'book.json').read_text())
 tracks={f'spread-{i+1}-{kind}':page['narration']['zh-CN'] if kind=='story' else page[kind] for i,page in enumerate(book['pages']) for kind in ('story','invitation','response')}
 value={'bookId':book['id'],'tracks':tracks,'scriptSha256':hashlib.sha256((folder/'book.json').read_bytes()).hexdigest()}
 (folder/'audio-manifest.json').write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n');return value
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('folder',type=Path);a=p.parse_args();print(json.dumps(build(a.folder),ensure_ascii=False,indent=2))
