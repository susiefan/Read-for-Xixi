"""Shared LLM judge contract and nonblocking-preference policy."""
from pathlib import Path
from openai_responses import create_structured_response
ROOT=Path(__file__).resolve().parents[1]
TEXT={'type':'string'}
def obj(props):return {'type':'object','properties':props,'required':list(props),'additionalProperties':False}
SCHEMA=obj({'scriptScore':{'type':'integer','minimum':1,'maximum':7},'visualPass':{'type':'boolean'},'findings':{'type':'array','items':obj({'scope':{'enum':['script','visual'],'type':'string'},'check':TEXT,'level':{'enum':['pass','suggestion','blocking'],'type':'string'},'message':TEXT,'sourcePageId':TEXT})}})
def judge(model,content,dimension='both'):
 value,_=create_structured_response(model=model,input_items=[{'role':'system','content':(ROOT/'prompts/interaction-judge.md').read_text()+f'\nRequested dimension: {dimension}.'},{'role':'user','content':content}],schema_name='shared_reading_judge',schema=SCHEMA)
 return value

def blocking_findings(result,dimension='both'):
 allowed={'script','visual'} if dimension=='both' else {dimension}
 # Only material findings cause retries. Contradictory low scores with only
 # preference suggestions are recorded for parent review, not endless rewriting.
 return [f for f in result['findings'] if f['scope'] in allowed and f['level']=='blocking']
