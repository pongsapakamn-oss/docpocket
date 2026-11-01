// Test build that behaves like the REAL build (isMock=false, code-split, lazy DEMO chunk) but with a spy instead of Supabase.
// Output: dist-spy/ (serve it with any static server).
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
let esbuild;try{esbuild=createRequire(root+'/')('esbuild')}catch(e){esbuild=createRequire('/opt/npm-tools/node_modules/')('esbuild')}
rmSync(root+'dist-spy',{recursive:true,force:true});
await esbuild.build({entryPoints:{main:root+'src/main.js'},bundle:true,splitting:true,format:'esm',target:'es2020',outdir:root+'dist-spy/assets',legalComments:'none',
  alias:{'@backend':root+'tools/backend-spy.js','@fonts':root+'src/fonts.stub.js'},define:{'import.meta.env.PROD':'false','import.meta.env.DEV':'true'}});
let html=readFileSync(root+'index.html','utf8');
html=html.replace(/<link rel="(manifest|icon|apple-touch-icon|apple-touch-startup-image)"[^>]*>\n?/g,'').replace('<link rel="stylesheet" href="/src/style.css">','<link rel="stylesheet" href="/style.css">').replace('/src/main.js','/assets/main.js');
writeFileSync(root+'dist-spy/index.html',html);writeFileSync(root+'dist-spy/style.css',readFileSync(root+'src/style.css'));
console.log('dist-spy/ built');
