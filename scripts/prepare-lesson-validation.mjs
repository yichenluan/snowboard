// Local-only fixtures for exercising the actual built page through its UI.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),out=new URL('.validation/',root);
const html=await readFile(new URL('snowboard-guide.html',root),'utf8');
const guide=JSON.parse(await readFile(new URL('content.json',root),'utf8'));
await mkdir(out,{recursive:true});
const noWebGL=`<script>/* Test fixture only: force the browser's ordinary no-WebGL fallback. */const originalGetContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/i.test(kind)?null:originalGetContext.call(this,kind,...args)};</script>`;
await writeFile(new URL('lesson-no-webgl.html',out),html.replace('<head>','<head>'+noWebGL));
await writeFile(new URL('lesson-old-backup.json',out),JSON.stringify({schemaVersion:2,guide:{schemaVersion:2,meta:{...guide.meta,contentRevision:3},lessons:[]},user:{notes:{'v-base-stance':'本地回归记录：旧备份笔记保留'},bookmarks:['v-base-stance'],additions:[],trash:[],skillProgress:[],skillTarget:'all'}},null,2));
console.log('本地测试文件：'+fileURLToPath(out));
