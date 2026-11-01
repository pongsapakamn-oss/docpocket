// TEST ONLY (used by tools/build-spy.mjs): stands in for the real Supabase client and records every call it receives,
// to prove that DEMO mode never talks to the real backend. Returns inert results.
export const configured=true,isMock=false,seed=null,demoOnly=false;
const calls=(window.__REAL=window.__REAL||[]);
const inert=path=>new Proxy(function(){},{get:(_,k)=>k==='then'?undefined:inert(path+'.'+String(k)),
  apply:()=>{calls.push(path);return Promise.resolve(path==='sb.auth.getSession'?{data:{session:null}}:{data:null,error:{message:'spy: no real backend'}})}});
export const sb=inert('sb');
