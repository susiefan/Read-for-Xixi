import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {addReadingAvatar,parseReadingAvatar,readAvatarLibrary,MAX_AVATAR_BYTES} from '../app/readingAvatar';
import {AvatarArtwork} from '../app/ReadingAvatarArtwork';
const raw=readFileSync(new URL('./fixtures/avatar-v1.json',import.meta.url),'utf8');
const example=()=>JSON.parse(raw);
test('data-only avatar imports and renders a self-contained animated rig',()=>{
 const avatar=parseReadingAvatar(raw);const svg=renderToStaticMarkup(createElement(AvatarArtwork,{avatar}));
 assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));assert.ok(svg.includes('data-part="eye-0"'));assert.ok(svg.includes('data-part="mouth-open"'));assert.ok(svg.indexOf('data-part="head"')<svg.indexOf('data-part="book-and-paws"'));
 const image=new Resvg(svg,{font:{loadSystemFonts:false}}).render();assert.equal(image.width,720);assert.equal(image.height,720);assert.ok(image.asPng().length>0);
 assert.ok(!svg.includes('NaN'));assert.ok(!svg.includes('<script'));
});
test('executable tags and event/link/style attributes are rejected before rendering',()=>{
 for(const [tag,attrs] of [['script',{}],['image',{href:'https://example.invalid/track'}],['path',{d:'M0 0',onload:'alert(1)'}],['path',{d:'M0 0',style:'background:url(https://example.invalid)'}]]){
  const x=example();x.parts.head.push({tag,attrs});assert.throws(()=>parseReadingAvatar(JSON.stringify(x)));
 }
});
test('unsupported versions, excessive size, nonfinite geometry and unknown colours fail',()=>{
 const version=example();version.version=2;assert.throws(()=>parseReadingAvatar(JSON.stringify(version)));
 assert.throws(()=>parseReadingAvatar(' '.repeat(MAX_AVATAR_BYTES+1)));
 for(const attrs of [{cx:1e100,cy:1,r:10,fill:'#b2cfd2'},{cx:1,cy:1,r:-10,fill:'#b2cfd2'},{cx:1,cy:1,r:10,fill:'#123456'}]){
  const x=example();x.parts.head.push({tag:'circle',attrs});assert.throws(()=>parseReadingAvatar(JSON.stringify(x)));
 }
});
test('reimporting one ID updates only that companion and preserves the others',()=>{
 const first=parseReadingAvatar(raw),second={...first,id:'other-elephant',name:'Other'};const before=[first,second];
 const after=addReadingAvatar(before,{...first,name:'Updated'});assert.equal(after.length,2);assert.equal(after[0].name,'Updated');assert.equal(after[1],second);assert.equal(before[0].name,first.name);
});
test('a full library rejects a new companion without changing accepted entries',()=>{
 const avatar=parseReadingAvatar(raw);const six=Array.from({length:6},(_,i)=>({...avatar,id:`friend-${i}`}));
 assert.throws(()=>addReadingAvatar(six,{...avatar,id:'seventh-friend'}));assert.equal(six.length,6);
 assert.deepEqual(readAvatarLibrary(JSON.stringify(six)),six);assert.deepEqual(readAvatarLibrary('{broken'),[]);
});
test('metadata is escaped as text in the SVG title and accessible name',()=>{
 const avatar=parseReadingAvatar(raw);avatar.name='<script>not executable</script>';
 const svg=renderToStaticMarkup(createElement(AvatarArtwork,{avatar}));assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('&lt;script&gt;'));
});
