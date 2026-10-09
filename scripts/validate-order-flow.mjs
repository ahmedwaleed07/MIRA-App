import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=(file)=>readFileSync(file,'utf8');
const check=(ok,message)=>{if(!ok)throw new Error('Order lifecycle: '+message)};
const inlineScript=(file)=>{
 const parts=[...read(file).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
 check(parts.length>0,'missing script in '+file);
 return parts.map(x=>x[1]).filter(x=>x.trim()).at(-1);
};
const storage=(initial={})=>{
 const values=new Map(Object.entries(initial));
 return {getItem:(k)=>values.has(k)?values.get(k):null,
  setItem:(k,v)=>values.set(k,String(v)),removeItem:(k)=>values.delete(k)};
};
const ids=['pageTitle','pageSub','authNotice','nameLabel','phone1Label','phone2Label',
 'govLabel','areaLabel','addressLabel','noteLabel','confirmBtn','backCart',
 'orderSummary','msg','customerName','phonePrimary','phoneSecondary',
 'governorate','area','fullAddress','customerNote'];
const element=(value='')=>({textContent:'',innerHTML:'',style:{},value,disabled:false});

function makeCheckout(cartItems,{guest=false,failStore=null}={}){
 const objects=Object.fromEntries(ids.map(id=>[id,element()]));
 Object.assign(objects,{
  customerName:element('Test Customer'),phonePrimary:element('07700000000'),
  phoneSecondary:element(''),governorate:element('Baghdad'),area:element('Mansour'),
  fullAddress:element('Test street'),customerNote:element('QA dry run')
 });
 const local=storage({mira_lang:'en',mira_cart:JSON.stringify(cartItems),mira_checkout:JSON.stringify({name:'Test Customer',phone1:'07700000000',phone2:'',governorate:'Baghdad',area:'Mansour',address:'Test street',note:'QA dry run'})});
 const tab=storage();const location={href:''},timers=[],requests=[];
 const cloud={
  payload:()=>guest?null:{role:'authenticated',sub:'customer-123'},
  requireAuth:()=>{if(guest)throw Error('Authenticated session required');return {role:'authenticated',sub:'customer-123'}},
  ensureFreshSession:async()=>{},
  session:{user:{id:'customer-123',user_metadata:{}}},
  request:async(path,opt)=>{
   check(path==='mira_orders','unexpected endpoint '+path);
   check(opt.method==='POST'&&opt.requireAuth===true,'checkout POST must be authenticated');
   const payload=JSON.parse(opt.body);
   if(failStore===payload.store_id){failStore=null;throw Error('Network failure');}
   requests.push(payload);return [{id:'order-'+requests.length,...payload}];
  }
 };
 const ctx=vm.createContext({...objects,localStorage:local,sessionStorage:tab,
  location,document:{documentElement:{lang:'',dir:''}},MiraCloud:cloud,
  MiraAuthFlow:{getVerifiedCustomer:async()=>guest?null:{id:'customer-123'},setReturn:dest=>tab.setItem('mira_auth_return',dest)},
  setTimeout:(callback)=>timers.push(callback),console,Date,JSON,Number,encodeURIComponent});
 vm.runInContext(inlineScript('docs/checkout.html'),ctx,{filename:'checkout-inline.js'});
 return {objects,local,location,timers,requests,cloud,ctx};
}
const pause=()=>new Promise(resolve=>setImmediate(resolve));
const items=[
 {storeId:'store-A',storeName:'Store A',offerId:'offer-A',title:'Item A',unitPrice:100,quantity:2},
 {storeId:'store-B',storeName:'Store B',offerId:'offer-B',title:'Item B',unitPrice:50,quantity:1}
];

async function testCheckout(){
 const guest=makeCheckout(items,{guest:true});
 await pause();
 check(guest.location.href.includes('signin.html'),'guests must be sent to Sign In');
 console.log('PASS guests cannot proceed to checkout without signing in');

 const complete=makeCheckout(items);await pause();
 await complete.objects.confirmBtn.onclick();
 check(complete.requests.length===2,'cart must create exactly two merchant orders (sent '+complete.requests.length+', UI: '+complete.objects.msg.textContent+')');
 check(complete.requests.map(x=>x.store_id).join(',')==='store-A,store-B','merchant routing mismatch');
 check(complete.requests.every(x=>x.customer_user_id==='customer-123'&&x.status==='new'),'incorrect owner or initial status');
 check(complete.requests[0].items[0].quantity===2&&complete.requests[0].subtotal===200,'item totals wrong');
 check(JSON.parse(complete.local.getItem('mira_cart')).length===0,'successful checkout must empty cart');
 check(complete.timers.length===1,'successful checkout must navigate to tracking page');
 complete.timers[0]();
 check(complete.location.href==='orders.html','checkout should open My Orders');
 console.log('PASS authenticated multi-merchant checkout splits orders, totals correctly, and opens tracking');

 const partial=makeCheckout(items,{failStore:'store-B'});await pause();
 await partial.objects.confirmBtn.onclick();
 check(partial.requests.length===1&&partial.requests[0].store_id==='store-A','first merchant not saved');
 const remaining=JSON.parse(partial.local.getItem('mira_cart'));
 check(remaining.length===1&&remaining[0].storeId==='store-B','retry must retain only unsent merchant');
 check(partial.objects.confirmBtn.disabled===false,'retry button should be re-enabled');
 check(partial.objects.msg.textContent.includes('Check My Orders'),'partial failure message should direct customer to orders');
 await partial.objects.confirmBtn.onclick();
 check(partial.requests.length===2,'second attempt should only submit remaining store');
 check(partial.requests.filter(x=>x.store_id==='store-A').length===1,'duplicate order after retry');
 check(JSON.parse(partial.local.getItem('mira_cart')).length===0,'retry must finish remaining cart');
 console.log('PASS partial checkout failure preserves unsent items without duplicating sent orders');

 const badStore=makeCheckout([{...items[0],storeId:null}]);await pause();
 await badStore.objects.confirmBtn.onclick();
 check(badStore.requests.length===0,'unassigned store must not receive an order');
 console.log('PASS checkout rejects unassigned stores');
}

async function testMerchantStatusUpdate(){
 const business=[...read('docs/business.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).join('\n');
 const start=business.indexOf('async function updateOrderStatus(id){');
 const end=business.indexOf('window.updateOrderStatus=updateOrderStatus',start);
 check(start>=0&&end>start,'merchant status update handler missing');
 const updates=[];
 const ctx=vm.createContext({
  merchantOrders:[{id:'order-1',status:'new',store_id:'store-A'}],
  document:{getElementById:()=>({value:'accepted'})},
  MiraCloud:{request:async(path,options)=>{
   updates.push({path,options});return [];
  }},
  renderOrders:()=>{},alert:(message)=>{throw Error('unexpected merchant status alert: '+message)},
  Date,JSON,encodeURIComponent
 });
 vm.runInContext(business.slice(start,end),ctx);
 await vm.runInContext("updateOrderStatus('order-1')",ctx);
 check(updates.length===1,'merchant update should issue exactly one PATCH');
 check(updates[0].path==='mira_orders?id=eq.order-1','merchant must target selected order');
 check(updates[0].options.method==='PATCH'&&updates[0].options.requireAuth===true,'merchant update must require auth');
 check(JSON.parse(updates[0].options.body).status==='accepted','merchant state transition incorrect');
 check(ctx.merchantOrders[0].status==='accepted','merchant must update local state');
 console.log('PASS merchant updates only selected order and uses an authenticated request');
}

async function testCustomerTracking(){
 const ordersSource=inlineScript('docs/orders.html');
 const objects=Object.fromEntries(['pageTitle','pageSub','orders','refreshBtn'].map(k=>[k,element()]));
 let current='new';const calls=[];
 const cloud={
  payload:()=>({role:'authenticated',sub:'customer-123'}),
  requireAuth:()=>({role:'authenticated',sub:'customer-123'}),
  ensureFreshSession:async()=>{},
  request:async(path,options)=>{
   calls.push({path,options});
   return [{id:'order-1',store_id:'store-A',status:current,
    items:[{title:'Item A',quantity:2}],total:200,currency:'IQD',
    created_at:'2026-10-08T12:00:00Z',updated_at:'2026-10-08T12:05:00Z'}];
  },
  list:async(kind)=>kind==='store'?[{id:'store-A',name:'Store A'}]:[]
 };
 const ctx=vm.createContext({...objects,localStorage:storage({mira_lang:'en'}),
  sessionStorage:storage(),location:{href:''},
  document:{documentElement:{lang:'',dir:''},visibilityState:'visible'},
  MiraCloud:cloud,MiraAuthFlow:{getVerifiedCustomer:async()=>({id:'customer-123'}),setReturn:()=>{}},setInterval:()=>{},console,Date,Number,JSON,Intl,encodeURIComponent
 });
 vm.runInContext(ordersSource,ctx,{filename:'orders-inline.js'});await pause();
 check(calls.length===1,'customer tracking fetch missing');
 check(calls[0].path.includes('customer_user_id=eq.customer-123'),'customer must query own orders');
 check(calls[0].options.requireAuth===true,'customer order read should require auth');
 check(objects.orders.innerHTML.includes('Order received'),'new order status missing');
 current='accepted';await objects.refreshBtn.onclick();
 check(objects.orders.innerHTML.includes('Confirmed'),'merchant status update not reflected in customer tracking');
 console.log('PASS customer tracking refresh displays merchant status update');
}
await testCheckout();
await testMerchantStatusUpdate();
await testCustomerTracking();
console.log('PASS MIRA customer → merchant → customer order lifecycle simulation (mocked API)');
