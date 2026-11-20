"""Last offline step: synthesize locked book tracks using an installed CosyVoice lab.

No API key, private reference voice, model download, or database setup is needed.
--python names the interpreter in your CosyVoice environment. Resumes existing
files only when manifest + profile identity still match the previous run.
"""
from __future__ import annotations
import argparse,hashlib,json,os,subprocess,sys,fcntl
from pathlib import Path
from book_package import ROOT,validate
from audio_job_state import atomic_write_json,utc_now

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('folders',nargs='+',type=Path);p.add_argument('--lab',type=Path,required=True);p.add_argument('--python',type=Path,required=True);p.add_argument('--voice-profile',type=Path,default=ROOT/'data/voices/mimi-instruct2.json');a=p.parse_args()
 for folder in a.folders:
  validate(folder)
  manifest=folder/'audio-manifest.json'
  if not manifest.is_file():p.error('Run scripts/build_package_manifest.py for this package first')
  identity=hashlib.sha256(manifest.read_bytes()+a.voice_profile.read_bytes()).hexdigest()
  output=folder/'audio';output.mkdir(exist_ok=True);receipt=output/'receipt.json';status=output/'status.json'
  if receipt.exists() and json.loads(receipt.read_text())['identity']!=identity:p.error('Text/profile changed. Preserve old audio and choose a fresh output package version.')
  atomic_write_json(receipt,{'identity':identity,'engine':'CosyVoice3','state':'generating','updatedAt':utc_now()})
  lock=open(output/'.worker.lock','w');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  env=os.environ.copy()
  for key in ('PYTHONHOME','PYTHONPATH','VIRTUAL_ENV','CONDA_PREFIX','CONDA_DEFAULT_ENV','__PYVENV_LAUNCHER__'):env.pop(key,None)
  cache=ROOT/'data/local/tts-cache';cache.mkdir(parents=True,exist_ok=True)
  env.update(STORYSPARK_TTS_LAB=str(a.lab.resolve()),NUMBA_CACHE_DIR=str(cache/'numba'),MPLCONFIGDIR=str(cache/'matplotlib'),PYTHONUNBUFFERED='1')
  result=subprocess.run([str(a.python.absolute()),str(ROOT/'scripts/generate_audio.py'),str(manifest.resolve()),'--output',str(output.resolve()),'--voice-profile',str(a.voice_profile.resolve()),'--lock-fd',str(lock.fileno()),'--status-file',str(status.resolve())],env=env,pass_fds=(lock.fileno(),))
  if result.returncode:raise SystemExit(result.returncode)
  validate(folder,require_audio=True)
  atomic_write_json(receipt,{'identity':identity,'engine':'CosyVoice3','state':'complete','updatedAt':utc_now()})
  atomic_write_json(status,{'status':'complete','expectedTracks':len(json.loads(manifest.read_text())['tracks']),'completedTracks':len(json.loads(manifest.read_text())['tracks']),'updatedAt':utc_now()})
  lock.close()
if __name__=='__main__':main()
