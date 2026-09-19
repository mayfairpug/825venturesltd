import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
const meta=JSON.parse(await fs.readFile('dist/assets/metadata.json','utf8'));
for(const p of meta){assert(p.description.length>=140&&p.description.length<=160,p.path);assert(/photography/i.test(p.description),p.path);assert(/archive/i.test(p.description)&&/London/.test(p.description),p.path);assert(p.keywords.includes('Robert Harper Photograph Library')&&p.keywords.includes('Archive.London'));assert(Number.isFinite(Date.parse(p.lastmod)));}
for(const file of ['sitemap.xml','sitemap-images.xml','sitemap-categories.xml']){const $=load(await fs.readFile('dist/'+file,'utf8'),{xml:true});for(const e of $('loc,image\\:loc').toArray()){const url=$(e).text();assert(url.startsWith('https://archive.london/'));const route=new URL(url).pathname;await fs.access('dist'+route+(route.endsWith('/')?'index.html':''));}assert($('lastmod').length===$('url').length);}
console.log('SEO metadata lengths, required terms, sitemap URLs, dates and image files passed for '+meta.length+' routes.');
