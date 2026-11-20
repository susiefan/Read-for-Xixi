"""Prepare existing local books without authoring, asset generation or TTS."""
import argparse
from pathlib import Path
from import_existing_library import import_library,ROOT
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--library-root',type=Path);p.add_argument('--source-dir',type=Path,action='append',default=[]);a=p.parse_args()
 if a.library_root: print(import_library(a.library_root,a.source_dir))
 elif (ROOT/'public/library/books.json').is_file(): print('Using already imported local books. Nothing regenerated.')
 else: p.exit(0,'No books bundled. Run import_existing_library.py with your local library path.\n')
