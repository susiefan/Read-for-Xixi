"""Prepare a local, text-only evaluation contribution. Never uploads anything.

Exports saved human ratings/comments only; no book scripts, scans, audio, child
profiles or filesystem paths. Legacy overall ratings keep their original meaning.
"""
from __future__ import annotations
import argparse,hashlib,json,re,sqlite3
from pathlib import Path

def redact(comment,names=()):
 for name in [*names,'希希','xixi','Xixi','XiXi']:comment=comment.replace(name,'[child]')
 comment=re.sub(r'/Users/[^\s<>"\']+','[local-path]',comment)
 comment=re.sub(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}','[contact]',comment)
 if re.search(r'sk-proj-|github_pat_|ghp_',comment):raise ValueError('Potential credential in feedback; review locally before export')
 return comment

def export(db,names=(),include_book_keys=False):
 records=[]
 with sqlite3.connect(f'file:{Path(db).resolve()}?mode=ro',uri=True) as c:
  for table,query in [('legacy-overall','select page_key,revision,score,comment,updated_at from reviews'),('split','select page_key,kind,revision,score,comment,updated_at from dimension_reviews')]:
   for row in c.execute(query):
    key,kind,revision,score,comment,date=(row[0],table,*row[1:]) if table=='legacy-overall' else row
    _,book,version,page=key.split('/',3)
    records.append({'id':hashlib.sha256(f'{key}|{kind}|{revision}'.encode()).hexdigest()[:24],'bookKey':book if include_book_keys else 'book-'+hashlib.sha256(book.encode()).hexdigest()[:12],'scriptVersion':version,'pageId':page,'dimension':kind,'score':score,'comment':redact(comment,names),'contentRevision':revision,'reviewDate':date[:10],'provenance':'saved human review','defaultVisualPassMayHaveApplied':kind=='visual' and score==1 and not comment.strip()})
 records.sort(key=lambda r:(r['bookKey'],r['scriptVersion'],r['pageId'],r['dimension'],r['contentRevision']))
 return {'schemaVersion':'1.0','license':'MIT','provenance':'Saved human editorial reviews exported locally; public contribution requires explicit approval; not child-study data','excluded':['source book text','generated page scripts','images/scans','audio','child profiles','reviewer identity','local filesystem paths'],'limitations':['Context-limited editorial ratings; original book/script/visual content is not distributed','Legacy overall scores are not relabelled as script scores','Saved positive visual scores may have used the UI default; no inference of independent visual review','Not a blinded benchmark or evidence of child language outcomes'],'records':records}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('database',type=Path);p.add_argument('--output',type=Path,required=True);p.add_argument('--redact-name',action='append',default=[]);p.add_argument('--include-book-keys',action='store_true');a=p.parse_args();data=export(a.database,a.redact_name,a.include_book_keys);a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'output':str(a.output),'records':len(data['records']),'sha256':hashlib.sha256(a.output.read_bytes()).hexdigest()}))
if __name__=='__main__':main()
