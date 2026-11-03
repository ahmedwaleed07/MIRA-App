import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const get=name=>readFileSync(name,'utf8');
for(const name of ['docs/mira-listing-reports.js','docs/mira-moderation-admin.js','docs/mira-notifications.js','docs/mira-footer-language.js'])new Script(get(name),{filename:name});
for(const name of ['docs/delete-account.html','docs/admin.html','docs/notifications.html','docs/profile.html','docs/friday-market.html','docs/car-direct.html']){
 const html=get(name);
 for(const item of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  if(item[1].trim())new Script(item[1],{filename:name});
}
const car=get('docs/car-direct.html'),friday=get('docs/friday-market.html'),admin=get('docs/admin.html');
assert.match(car,/data-mira-report="car"/);
assert.match(friday,/data-mira-report="friday"/);
assert.match(friday,/id:x.id,images:/);
for(const page of [car,friday]){
 assert.match(page,/mira-listing-reports\.js/);
 assert.match(page,/موافقة الأدمن|موافقة/);
}
assert.match(admin,/id="moderation"/);
assert.match(admin,/data-panel="moderation"/);
assert.match(admin,/mira-moderation-admin\.js/);
assert.match(get('docs/profile.html'),/href="delete-account\.html"/);
assert.match(get('docs/delete-account.html'),/\/functions\/v1\/mira-delete-account/);
assert.match(get('supabase/functions/mira-delete-account/index.ts'),/admin\.auth\.admin\.deleteUser\(user\.id\)/);
assert.match(get('docs/notifications.html'),/data-filter="review"/);
assert.match(get('docs/mira-notifications.js'),/mira_listing_review_events/);
assert.match(get('docs/mira-notifications.js'),/mira_listing_reports/);
assert.match(get('scripts/sync-mobile-from-docs.mjs'),/cpSync\(src,dst/);
assert.match(get('.github/workflows/native-build.yml'),/npm run prepare:web/g);
assert.equal(JSON.parse(get('package.json')).scripts['prepare:web'],'node scripts/sync-mobile-from-docs.mjs');
for(const name of ['docs/car-direct.html','docs/friday-market.html']){
 assert.ok(!get(name).includes('status:"active"')&&!get(name).includes("status:'active'"),
  'Personal listings may not request active status directly');
}
console.log('PASS MIRA launch workflow, moderation, reporting, notifications, deletion and single-source native sync');
