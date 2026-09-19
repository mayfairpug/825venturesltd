import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {transform} from 'esbuild';
const base='https://archive.london';
const compact=(s,n)=>s.length<=n?s:s.slice(0,n-16).replace(/\s+\S*$/,'')+' '+s.slice(-15).replace(/^\S*\s/,'');
export function metadata(p){
 const topic=p.id==='home'?'Robert Harper Photograph Library':p.title;
 p.metaTitle=compact(topic,48)+' · Archive.London';
 const short=compact(topic,43);
 let d=`Explore ${short.toLowerCase()} photography in the Robert Harper Photograph Library archive. Archive.London presents the collection for research.`;
 if(d.length<140)d=d.replace('for research.','for editorial and design research.');
 if(d.length>160)d=d.replace('the Robert Harper Photograph Library archive','Robert Harper’s photographic archive');
 if(d.length<140)d=d.replace('for research.','for editorial and design research.');
 const special={home:'Explore the Robert Harper Photograph Library at Archive.London, a photography archive spanning fashion, beauty, portraits, travel and studio studies.',contact:'Contact Archive.London about the Robert Harper Photograph Library. Enquire about photography archive research, collection information and professional access.','professional-access':'Explore professional access to the Robert Harper Photograph Library at Archive.London, including photography archive research and institutional enquiries.','rights-and-stewardship':'Read about the care and stewardship of the Robert Harper Photograph Library at Archive.London, with information on photography archive rights and access.'};
 d=special[p.id]||d;
 if(d.length<140||d.length>160)throw Error('Description length: '+p.id+' '+d.length);
 p.metaDescription=d;p.metaKeywords=`${topic}, Robert Harper Photograph Library, Archive.London, photography archive, London`;
 p.ogTitle=p.metaTitle;p.ogDescription=d;
 if(p.id==='home')p.h1='The Robert Harper Photograph Library';
}
export function enrich(graph,p){
 const page=graph.find(x=>x['@id']===base+p.path+'#page');
 if(p.id==='home')page['@type']='WebPage';
 page.keywords=p.metaKeywords;
 if(p.semanticAbout)page.about=p.semanticAbout;
 const about=Array.isArray(page.about)?page.about:[page.about];
 for(const a of about){if(a?.name==='Chanel'&&p.id.includes('fragrance'))a.sameAs='https://www.chanel.com/us/fragrance/';if(a?.name==='Christian Dior')a.sameAs='https://www.dior.com/en_us/beauty/fragrance/fragrance-homepage.html';}
}
export async function optimise(pages,images){
 let state={};try{state=JSON.parse(await fs.readFile('content/seo-state.json','utf8'));}catch{}
 const next={};const css=await fs.readFile('site/site.css','utf8');
 const minCss=(await transform(css,{loader:'css',minify:true})).code;
 await fs.writeFile('dist/assets/site.css',minCss);
 await fs.writeFile('dist/assets/site.js',(await transform(await fs.readFile('site/site.js','utf8'),{loader:'js',minify:true})).code);
 const major=pages.filter(p=>p.pageType==='principal_collection');
 const links='<nav class="footer-categories" aria-label="Major archive categories">'+major.map(p=>`<a href="${p.path}">${p.title.replaceAll('&','&amp;')}</a>`).join('')+'</nav>';
 for(const p of pages){const file='dist'+(p.path==='/'?'/index.html':p.path+'index.html');let html=await fs.readFile(file,'utf8');
 
 html=html.replace('<meta name="description"',`<meta name="keywords" content="${p.metaKeywords.replaceAll('&','&amp;').replaceAll('"','&quot;')}"><meta name="description"`);
 if(p.id==='home'){html=html.replace('<link rel="stylesheet" href="/assets/site.css">',`<!-- Inline homepage styles avoid a render-blocking stylesheet request. --><style>${minCss}</style>`);}
 const hash=createHash('sha256').update(html).digest('hex');next[p.path]={hash,lastmod:state[p.path]?.hash===hash?state[p.path].lastmod:new Date().toISOString()};await fs.writeFile(file,html);
 }
 const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
 const url=(p,priority)=>`<url><loc>${base+p.path}</loc><lastmod>${next[p.path].lastmod}</lastmod><priority>${priority}</priority></url>`;
 const wrap=body=>`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
 await fs.writeFile('dist/sitemap.xml',wrap(pages.map(p=>url(p,p.path==='/'?'1.0':'0.8')).join('')));
 await fs.writeFile('dist/sitemap-categories.xml',wrap(pages.filter(p=>p.path.startsWith('/photography-archive/')&&p.id!=='photography-archive').map(p=>url(p,'0.8')).join('')));
 await fs.writeFile('dist/sitemap-images.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"><url><loc>${base}/</loc><lastmod>${next['/'].lastmod}</lastmod><priority>0.6</priority>${images.map(im=>`<image:image><image:loc>${base}/assets/images/${im.id}-${im.width}.webp</image:loc></image:image>`).join('')}</url></urlset>`);
 await fs.writeFile('dist/robots.txt',`User-agent: *\nAllow: /\n${['sitemap.xml','sitemap-images.xml','sitemap-categories.xml'].map(s=>'Sitemap: '+base+'/'+s).join('\n')}\n`);
 await fs.writeFile('dist/_headers','/*\n  Cache-Control: public, max-age=0, must-revalidate\n/assets/*\n  Cache-Control: public, max-age=3600, must-revalidate\n/assets/fonts/*\n  Cache-Control: public, max-age=604800\n');
 await fs.writeFile('content/seo-state.json',JSON.stringify(next,null,2)+'\n');
 await fs.writeFile('dist/assets/metadata.json',JSON.stringify(pages.map(p=>({path:p.path,title:p.metaTitle,description:p.metaDescription,keywords:p.metaKeywords,lastmod:next[p.path].lastmod})),null,2));
 async function compress(dir){for(const ent of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,ent.name);if(ent.isDirectory())await compress(file);else if(/\.(html|css|js|json|xml|svg)$/.test(file)){const bytes=await fs.readFile(file);await fs.writeFile(file+'.gz',gzipSync(bytes));await fs.writeFile(file+'.br',brotliCompressSync(bytes));}}}
 await compress('dist');
}
