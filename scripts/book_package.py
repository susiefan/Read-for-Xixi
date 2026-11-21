"""Validate, export and safely import a portable .xixi.zip book package (no API).

The package directory contains book.json, source.json, a licensed source PDF,
assets/*.svg, and optionally audio/*.wav. Downloads, keys and human review
records are never needed for validation or example playback.
"""
from __future__ import annotations
import argparse, hashlib, json, re, shutil, tempfile, zipfile
from pathlib import Path, PurePosixPath
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
ID=re.compile(r'[a-z][a-z0-9-]{0,63}\Z')
MAX_FILES=1000; MAX_BYTES=250_000_000

def read(p): return json.loads(p.read_text(encoding='utf-8'))
def safe_file(root, name):
    path=PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or '\\' in name or not path.parts:
        raise ValueError('Unsafe package path: '+name)
    target=root.joinpath(*path.parts)
    if not target.resolve().is_relative_to(root.resolve()) or target.is_symlink():
        raise ValueError('Path escapes package: '+name)
    return target

def check_svg(path):
    data=path.read_text(encoding='utf-8')
    if '<!DOCTYPE' in data.upper() or '<!ENTITY' in data.upper(): raise ValueError('SVG entities forbidden')
    root=ET.fromstring(data)
    if root.tag!='{http://www.w3.org/2000/svg}svg' or root.get('viewBox')!='0 0 720 720':
        raise ValueError(f'{path.name}: SVG needs 720-square viewBox')
    allowed={'svg','title','g','path','rect','ellipse','circle','line','polyline','polygon','defs','clipPath'}
    for node in root.iter():
        tag=node.tag.rsplit('}',1)[-1]
        if tag not in allowed: raise ValueError(f'{path.name}: unsafe SVG tag {tag}')
        for attr,value in node.attrib.items():
            if attr.lower().startswith('on') or 'href' in attr.lower() or re.search(r'url\(\s*(?!#)',value):
                raise ValueError(f'{path.name}: unsafe SVG attribute')
        if tag=='rect' and node.get('width')=='720' and node.get('height')=='720' and node.get('fill') not in ('none','transparent'):
            raise ValueError(f'{path.name}: full-canvas opaque background forbidden')

def validate(folder, require_audio=False, allow_draft=False):
    folder=Path(folder); book=read(folder/'book.json'); source=read(folder/'source.json')
    try: import jsonschema
    except ImportError: raise ValueError('Install requirements.txt before validating packages')
    jsonschema.validate(book,read(ROOT/'schemas/book-package.schema.json'))
    if not ID.fullmatch(book['id']) or source['bookId']!=book['id']: raise ValueError('Invalid or mismatched book ID')
    pdf=safe_file(folder,book['sourcePdf'])
    if pdf.suffix!='.pdf' or not pdf.is_file(): raise ValueError('Missing source PDF')
    if hashlib.sha256(pdf.read_bytes()).hexdigest()!=source['sha256']: raise ValueError('Source PDF hash changed')
    if not allow_draft and any('待创作' in json.dumps(page,ensure_ascii=False) for page in book['pages']): raise ValueError('Unfinished draft: replace all authoring placeholders')
    pages=book['pages']; ids=[p['pageId'] for p in pages]
    if len(set(ids))!=len(ids) or ids!=[p['pageId'] for p in source['pages']]: raise ValueError('Page IDs/order differ from source')
    seen=set()
    for p,e in zip(pages,source['pages']):
        if p['story']!=e['printedEvidence']: raise ValueError(p['pageId']+': printed text changed')
        if p['invitation'] in seen: raise ValueError(p['pageId']+': exact repeated invitation')
        seen.add(p['invitation'])
        if p['visualPlan']['sourcePageId']!=p['pageId']: raise ValueError('Visual source page mismatch')
        check_svg(safe_file(folder,'assets/'+p['pageId']+'.svg'))
        if require_audio:
            from check_existing_library import wav_duration
            for kind in ('story','invitation','response'):
                wav_duration(folder/'audio'/f'spread-{pages.index(p)+1}-{kind}.wav')
    return {'id':book['id'],'pages':len(pages),'audioRequired':require_audio,'status':'pass'}

def export(folder, output):
    folder=Path(folder);validate(folder)
    files=[p for p in folder.rglob('*') if p.is_file() and p.name not in ('status.json','receipt.json','.worker.lock','manifest.sha256.json')]
    if any(p.is_symlink() for p in folder.rglob('*')): raise ValueError('Symlinks forbidden')
    manifest={p.relative_to(folder).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
    if len(files)>MAX_FILES or sum(p.stat().st_size for p in files)>MAX_BYTES: raise ValueError('Package too large')
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
        for p in files:z.write(p,p.relative_to(folder))
        z.writestr('manifest.sha256.json',json.dumps(manifest,indent=2))
    return manifest

def install(archive, destination):
    destination=Path(destination)
    if destination.exists():raise ValueError('Destination already exists; choose a new version folder')
    destination.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(dir=destination.parent) as temp:
        stage=Path(temp)/'book';stage.mkdir()
        with zipfile.ZipFile(archive) as z:
            if len(z.infolist())>MAX_FILES+1 or sum(x.file_size for x in z.infolist())>MAX_BYTES:raise ValueError('Package exceeds limits')
            names=z.namelist()
            if len(set(names))!=len(names):raise ValueError('Duplicate archive members')
            for info in z.infolist():
                if info.is_dir():continue
                if (info.external_attr>>16)&0o170000==0o120000:raise ValueError('Archive symlink forbidden')
                target=safe_file(stage,info.filename);target.parent.mkdir(parents=True,exist_ok=True)
                target.write_bytes(z.read(info))
        manifest=read(stage/'manifest.sha256.json')
        files={p.relative_to(stage).as_posix() for p in stage.rglob('*') if p.is_file()}-{'manifest.sha256.json'}
        if set(manifest)!=files:raise ValueError('Package manifest file set differs')
        for name,digest in manifest.items():
            if hashlib.sha256(safe_file(stage,name).read_bytes()).hexdigest()!=digest:raise ValueError('Hash mismatch: '+name)
        validate(stage);shutil.move(str(stage),str(destination))
    return str(destination)

def main():
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='cmd',required=True)
    v=sub.add_parser('validate');v.add_argument('folders',nargs='+',type=Path);v.add_argument('--require-audio',action='store_true')
    e=sub.add_parser('export');e.add_argument('folder',type=Path);e.add_argument('output',type=Path)
    i=sub.add_parser('import');i.add_argument('archive',type=Path);i.add_argument('destination',type=Path)
    a=p.parse_args()
    try:
        result=[validate(f,a.require_audio) for f in a.folders] if a.cmd=='validate' else export(a.folder,a.output) if a.cmd=='export' else install(a.archive,a.destination)
    except (ValueError,OSError,KeyError) as error:p.exit(1,str(error)+'\n')
    print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
