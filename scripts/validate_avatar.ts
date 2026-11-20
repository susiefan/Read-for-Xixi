/** Validate a parent-created data-only avatar and optionally export an SVG preview. */
import {readFileSync,writeFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {parseReadingAvatar} from '../app/readingAvatar';
import {AvatarArtwork} from '../app/ReadingAvatarArtwork';
const [file,flag,preview]=process.argv.slice(2);
if(!file||(flag&&flag!=='--preview')||(flag&&!preview)){console.error('Usage: pnpm avatar:validate FILE [--preview output.svg]');process.exit(1);}
try {
 const avatar=parseReadingAvatar(readFileSync(file,'utf8'));
 if(preview)writeFileSync(preview,renderToStaticMarkup(createElement(AvatarArtwork,{avatar}))+'\n');
 console.log(JSON.stringify({valid:true,id:avatar.id,name:avatar.name,format:avatar.format}));
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exit(1);}
