import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const pkg=JSON.parse(read('package.json'));
const workflow=read('.github/workflows/native-build.yml');
const validation=read('.github/workflows/validate.yml');
const sync=read('scripts/sync-mobile-from-docs.mjs');
for(const os of ['android','ios']){
 assert.match(workflow,new RegExp('^  '+os+':','m'),'Missing '+os+' native build job');
}
assert.match(workflow,/^  web-parity:/m,'Both native builds must depend on a shared parity preflight');
assert.ok((workflow.match(/needs: web-parity/g)||[]).length===2,'Both platforms must depend on web parity');
assert.ok((workflow.match(/node scripts\/verify-mobile-parity\.mjs --expected=/g)||[]).length===2,'Both platforms must check the SAME source hash');
assert.match(workflow,/run: npm run prepare:web/);
assert.match(sync,/rmSync\(dst,\{recursive:true,force:true\}\)/,'Stale files must be removed before packaging');
assert.equal(pkg.scripts['prepare:web'],'node scripts/sync-mobile-from-docs.mjs');
assert.match(pkg.scripts.copy,/prepare:web/,'Manual Capacitor copy must use fresh web assets');
assert.match(validation,/node scripts\/verify-mobile-parity\.mjs/);
assert.match(read('docs/taxonomy.js'),/slug:'real-estate'/);
assert.match(read('docs/taxonomy.js'),/slug:'showrooms'/);
console.log('PASS native release parity policy: fresh source, common SHA-256 and both OS builds gated');
