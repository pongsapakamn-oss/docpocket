import {createClient} from '@supabase/supabase-js';
const U=import.meta.env.VITE_SUPABASE_URL,K=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured=!!(U&&K);
export const sb=configured?createClient(U,K,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export const isMock=false;
// VITE_DEMO_ONLY=1 -> the deployed app always opens in DEMO mode (no Supabase needed); handy for a public demo / install-to-home-screen preview
export const demoOnly=import.meta.env.VITE_DEMO_ONLY==='1';
export const seed=null;
