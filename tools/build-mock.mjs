// Builds a single-file test version (dist-mock/index.html) that uses the in-memory fake backend.
// Uses esbuild: from node_modules if installed, otherwise from the global tools folder.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
let esbuild;try{esbuild=createRequire(root+'/')('esbuild')}catch(e){esbuild=createRequire('/opt/npm-tools/node_modules/')('esbuild')}
const out=await esbuild.build({entryPoints:[root+'src/main.js'],bundle:true,write:false,format:'iife',target:'es2020',legalComments:'none',
  alias:{'@backend':root+'src/mock.js','@fonts':root+'src/fonts.stub.js'},
  define:{'import.meta.env.PROD':'false','import.meta.env.DEV':'true'}});
const js=out.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
let html=readFileSync(root+'index.html','utf8');
html=html.replace(/<link rel="(manifest|icon|apple-touch-icon|apple-touch-startup-image)"[^>]*>\n?/g,'')
  .replace('</head>','<!-- test build only: the real build self-hosts Prompt via @fontsource -->\n<script>/* added without blocking: a slow or blocked font request must never delay the app */(function(){var l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&display=swap";document.head.appendChild(l)})()</script>\n</head>')
  .replace('<link rel="stylesheet" href="/src/style.css">',`<style>${readFileSync(root+'src/style.css','utf8')}</style>`)
  .replace('<script type="module" src="/src/main.js"></script>',()=>`<script>${js}</script>`);
mkdirSync(root+'dist-mock',{recursive:true});writeFileSync(root+'dist-mock/index.html',html);
console.log('dist-mock/index.html',(html.length/1024).toFixed(0)+' KB');
