import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const r=p=>fileURLToPath(new URL(p,import.meta.url));
// `npm run build` -> production build with the real Supabase backend (dist/).
// `npm run build:mock` (tools/build-mock.mjs) -> single-file test build with an in-memory fake backend.
export default defineConfig({
  resolve:{alias:{'@backend':r('./src/backend.js'),'@fonts':r('./src/fonts.js')}},
  build:{target:'es2020',assetsInlineLimit:4096}
});
