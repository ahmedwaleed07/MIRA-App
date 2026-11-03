// Verify the EXACT same web payload is used by both native builds.
// This compares every file, including images, fonts, CSS, languages and all app pages.
// Usage: node scripts/verify-mobile-parity.mjs [--digest-only] [--expected=<sha256>]
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,readFileSync,readdirSync} from 'node:fs';
import {join,relative,resolve,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..'),source=join(root,'docs'),bundle=join(root,'www');
function walk(rootDir){
 const files=[];
 function visit(directory){
  for(const item of readdirSync(directory,{withFileTypes:true})){
   const abs=join(directory,item.name),rel=relative(rootDir,abs).split(sep).join('/');
   // A symlink may escape the approved source tree and must never go into the bundle.
   if(item.isSymbolicLink()||lstatSync(abs).isSymbolicLink())throw Error('Symlink prohibited in mobile bundle: '+rel);
   if(item.isDirectory())visit(abs);
   else if(item.isFile())files.push(rel);
   else throw Error('Unsupported mobile source entry: '+rel);
  }
 }
 visit(rootDir);
 return files.sort();
}
if(!existsSync(source)||!existsSync(bundle))throw Error('Missing docs/ or www/; run npm run prepare:web first');
const docsFiles=walk(source),wwwFiles=walk(bundle);
assert.deepEqual(wwwFiles,docsFiles,'Mobile bundle differs from approved web source (missing or stale files)');
const payload=createHash('sha256');
for(const name of docsFiles){
 const a=readFileSync(join(source,name)),b=readFileSync(join(bundle,name));
 assert.equal(a.length,b.length,'Web/native file length mismatch: '+name);
 assert.ok(a.equals(b),'Web/native file content mismatch: '+name);
 // Stable across OS, file timestamps and source checkout locations.
 payload.update(name,'utf8');payload.update('\0');
 payload.update(createHash('sha256').update(a).digest('hex'));payload.update('\n');
}
const fingerprint=payload.digest('hex');
const expected=process.argv.find(x=>x.startsWith('--expected='))?.slice('--expected='.length);
if(expected&&!/^[a-f0-9]{64}$/i.test(expected))throw Error('Invalid expected web SHA-256');
if(expected&&fingerprint!==expected)throw Error('iOS/Android web bundle fingerprint mismatch: '+fingerprint+' != '+expected);
const index=readFileSync(join(bundle,'index.html'),'utf8');
assert.match(index,/welcome\.html/,'Both mobile OS releases must open the approved welcome flow');
assert.doesNotMatch(index,/src=["']app\.js/,'Legacy app must not be the mobile entry');
const config=readFileSync(join(root,'capacitor.config.ts'),'utf8');
assert.match(config,/appId:\s*'com\.asas360\.mira'/);
assert.match(config,/webDir:\s*'www'/);
for(const name of ['taxonomy.js','category.html','business.html','admin.html','welcome.html']){
 assert.ok(docsFiles.includes(name),'Essential parity source missing: '+name);
}
if(process.argv.includes('--digest-only'))process.stdout.write(fingerprint+'\n');
else console.log('PASS iOS = Android = web source: '+docsFiles.length+' identical assets, SHA-256 '+fingerprint);
