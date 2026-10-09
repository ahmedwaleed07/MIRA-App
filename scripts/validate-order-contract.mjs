// Keep the customer / merchant / tracking UI contract aligned with the schema.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>readFileSync(path,'utf8');
const migration=read('supabase/migrations/20261009_mira_web_orders_contract.sql');
const checkout=read('docs/checkout.html');
const offer=read('docs/offer.html');
const business=read('docs/business.html');
const orders=read('docs/orders.html');
const cart=read('docs/cart.html');
const cloud=read('docs/mira-cloud.js');

const customerColumns=['customer_user_id','store_id','offer_id','customer_name','phone_primary','phone_secondary','governorate_city','full_address','landmark','customer_note','items','subtotal','total','currency','status'];
for(const column of customerColumns){
 assert.match(migration,new RegExp('\\b'+column+'\\s+(?:uuid|text|jsonb|numeric)','i'),'Schema missing '+column);
 assert.ok(checkout.includes(column+':'),'Checkout missing '+column);
}
for(const column of ['phone_primary','phone_secondary','governorate_city','full_address','landmark','customer_note','items','status']){
 assert.ok(business.includes(column),'Merchant order list missing '+column);
}
assert.match(migration,/create table if not exists public\.mira_orders/i);
assert.match(migration,/alter table public\.mira_orders enable row level security;/i);
assert.match(migration,/customer_user_id=auth\.uid\(\)/i);
assert.match(migration,/mira_is_assigned_store\(store_id::text\)/i);
assert.match(migration,/for select to authenticated using \(customer_user_id=auth\.uid\(\)\)/i);
assert.match(migration,/for insert to authenticated with check\s*\(\s*customer_user_id=auth\.uid\(\) and status='new'/i);
assert.match(migration,/for update to authenticated[\s\S]*?with check \(public\.mira_is_assigned_store\(store_id::text\)\)/i);
assert.match(migration,/public\.mira_order_status_history/);
assert.match(migration,/mira_order_write_guard/);
assert.match(migration,/revoke all on public\.mira_orders from anon/i);
assert.ok(!migration.includes('drop table public.orders'),'Legacy order tables must not be destroyed');
console.log('PASS Supabase web schema matches 15 customer order fields, owner/merchant RLS, immutable records and status auditing');

assert.ok(cart.includes("location.href='checkout.html'"),'Guests and signed-in shoppers must both pass through protected checkout');
assert.ok(checkout.includes('await MiraAuthFlow.getVerifiedCustomer()'),'Checkout requires remotely validated customer');
assert.ok(checkout.includes('MiraAuthFlow.setReturn'),'Checkout remembers destination for sign-in');
assert.ok(checkout.includes("localStorage.setItem('mira_cart',JSON.stringify(cart().filter"),'Cart should retain only unsent merchants for retries');
assert.ok(offer.includes('await MiraAuthFlow.getVerifiedCustomer()'),'Direct offer orders must verify customer identity');
assert.ok(offer.includes('if(submitOrder.disabled)return'),'Direct order form must block duplicate rapid submissions');
assert.ok(business.includes("'&store_id=eq.'+encodeURIComponent(merchant.storeId)"),'Merchant status changes must be scoped to assigned store');
assert.ok(business.includes('return=representation'),'Merchant must check server status acknowledgement');
assert.ok(business.includes('rows.length!==1'),'Merchant may not optimistically mark status without server confirmation');
assert.ok(orders.includes("customer_user_id=eq.'+encodeURIComponent(p.sub)"),'Customer may see only own orders');
assert.ok(orders.includes('await MiraAuthFlow.getVerifiedCustomer()'),'Customer history requires remotely verified session');
assert.ok(orders.includes("setInterval(()=>{if(document.visibilityState==='visible')loadOrders()},15000)"),'Customer tracking should refresh while visible');
assert.ok(cloud.includes('async getCurrentUser()'),'Shared auth identity must validate against remote server');
console.log('PASS guest checkout gate, safe retry, direct-offer auth, merchant write acknowledgement and live customer tracking');

const statuses=['new','accepted','preparing','ready','out_for_delivery','completed','cancelled'];
for(const status of statuses){
 assert.ok(migration.includes("'"+status+"'"),'DB status missing '+status);
 assert.ok(business.includes(status+':'),'Merchant status missing '+status);
 assert.ok(orders.includes(status+':'),'Customer progress status missing '+status);
}
console.log('PASS all seven order status values match across SQL, merchant and customer screens');
