import test from 'node:test';
import assert from 'node:assert/strict';
import {afterAudio,pageDestination,readStars} from '../app/readingFlow';
import {whiteCatPose,whiteCatMouthPath} from '../app/whiteCatRig';
test('each page narrates, invites, then waits for an adult-triggered response',()=>{
 assert.equal(afterAudio('story'),'invitation');assert.equal(afterAudio('invitation'),'waiting');assert.equal(afterAudio('response'),'ready');
 // Navigation is independent of audio phase and cannot leave the book bounds.
 for(const _ of ['story','invitation','waiting','response','ready']){
  assert.equal(pageDestination(2,-1,5),1);assert.equal(pageDestination(2,1,5),3);
 }
 assert.equal(pageDestination(0,-1,5),0);assert.equal(pageDestination(4,1,5),4);
});
test('star balance survives invalid stored values and grows from prior balance',()=>{
 assert.equal(readStars('17')+1,18);for(const bad of ['NaN','-1','1.5','Infinity'])assert.equal(readStars(bad),0);
});
test('white cat pose remains finite across long sessions and audio extremes',()=>{
 for(let time=0;time<1000;time+=.37){const pose=whiteCatPose(time,true,time%1,'speaking',false,{x:0,y:0,weight:0});for(const value of Object.values(pose))assert.ok(Number.isFinite(value));assert.ok(!whiteCatMouthPath(pose.mouth).includes('NaN'));}
});
