import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
const root=path.resolve('dist');
const register=JSON.parse(await fs.readFile(root+'/assets/page-register.json','utf8'));
const sources=JSON.parse(await fs.readFile('content/pages.json','utf8'));
const errors=[],warnings=[],stats=[],seen=new Map(),documents=new Map();
const check=(truth,msg)=>{if(!truth)errors.push(msg);};
const unique=(field,value,url)=>{const key=field+':'+value;if(seen.has(key))errors.push(`Duplicate ${field}: ${url} and ${seen.get(key)}`);seen.set(key,url);};
for(const p of register){
 const html=await fs.readFile(root+(p.path==='/'?'/index.html':p.path+'index.html'),'utf8');
 const $=load(html);documents.set(p.path,$);
 check($('html').attr('lang')==='en-GB',`${p.path}: language`);
 check($('h1').length===1,`${p.path}: must have one H1`);
 for(const [key,value] of [['title',$('title').text()],['description',$('meta[name="description"]').attr('content')],['h1',$('h1').text()]]){check(Boolean(value),`${p.path}: missing ${key}`);unique(key,value,p.path);}
 check($('h1').text()===p.h1,`${p.path}: H1 mismatch`);
 check($('link[rel="canonical"]').length===1&&$('link[rel="canonical"]').attr('href')==='https://archive.london'+p.path,`${p.path}: canonical`);
 for(const key of ['og:title','og:description','og:url'])check(Boolean($(`meta[property="${key}"]`).attr('content')),`${p.path}: missing ${key}`);
 for(const key of ['twitter:card','twitter:title','twitter:description'])check(Boolean($(`meta[name="${key}"]`).attr('content')),`${p.path}: missing ${key}`);
 if(!p.heroImage)check(!$('meta[property="og:image"]').length,`${p.path}: unrelated sharing image`);
 let level=0;$('main h1,main h2,main h3,main h4').each((_,e)=>{const next=Number(e.tagName[1]);check(next<=level+1,`${p.path}: skipped heading level at ${$(e).text()}`);level=next;});
 const ids=new Set();$('[id]').each((_,e)=>{check(!ids.has(e.attribs.id),`${p.path}: duplicate ID ${e.attribs.id}`);ids.add(e.attribs.id);});
 $('img').each((_,e)=>{const im=$(e);check(!!im.attr('alt'),`${p.path}: empty image alt`);check(Number(im.attr('width'))>0&&Number(im.attr('height'))>0,`${p.path}: image dimensions`);check(!!im.attr('srcset'),`${p.path}: responsive image missing`);});
 const visible=$('main').text();
 check(!/[\u2013\u2014]/.test(visible),`${p.path}: prohibited dash`);
 check(!/\[(CATEGORY|BRAND|IMAGE COUNT|LOCATION|INSERT COPY)\]|undefined|\[Explore |\[Enquire /i.test(visible),`${p.path}: placeholder`);
 check(!/page should|page must|pages should|pages must|must be confirmed before|should be created|should receive individual/i.test(visible),`${p.path}: production guidance in copy`);
 check(!/825venturesltd\.online/.test(html),`${p.path}: old public domain`);
 let schema;try{schema=JSON.parse($('script[type="application/ld+json"]').text());}catch{errors.push(`${p.path}: invalid JSON-LD`);}
 if(schema){check(schema['@context']==='https://schema.org'&&Array.isArray(schema['@graph']),`${p.path}: schema structure`);const graph=schema['@graph'],entities=new Set(graph.map(g=>g['@id']));
  const web=graph.find(g=>g['@id']==='https://archive.london'+p.path+'#page');
  check(web?.name===$('h1').text(),`${p.path}: schema/visible heading mismatch`);
  check(web?.description===p.metaDescription,`${p.path}: schema description mismatch`);
  if(p.pageType==='biography')check(web['@type']==='ProfilePage'&&!!web.mainEntity,`${p.path}: profile entity`);
  const allowed=new Set(['Organization','WebSite','Person','ProfilePage','ContactPage','WebPage','CollectionPage','BreadcrumbList','ItemList','ImageObject']);
  for(const g of graph){check(allowed.has(g['@type']),`${p.path}: unexpected schema type`);if(g['@type']==='ItemList'){check(g.numberOfItems===g.itemListElement.length,`${p.path}: item count`);for(const item of g.itemListElement)check($(`a[href="${new URL(item.url).pathname}"]`).length,`${p.path}: schema item not visible`);}if(g['@type']==='ImageObject')check($(`img[src="${new URL(g.contentUrl).pathname}"]`).length,`${p.path}: schema image not displayed`);}
  const walk=v=>{if(!v||typeof v!=='object')return;if(v['@id']&&Object.keys(v).length===1)check(entities.has(v['@id']),`${p.path}: unresolved schema reference ${v['@id']}`);for(const val of Object.values(v))walk(val);};walk(schema);
 }
 const body=$('article.prose').text().trim();
 stats.push({path:p.path,words:body.split(/\s+/).length,titleLength:p.metaTitle.length,descriptionLength:p.metaDescription.length,imageCount:$('img').length,htmlBytes:Buffer.byteLength(html)});
 if(p.metaTitle.length>65||p.metaDescription.length>165)warnings.push(`${p.path}: preview length deserves editorial review`);
}
for(const [url,$] of documents){
 for(const el of $('a[href],img[src],script[src],link[href],source[srcset]').toArray()){
  const raw=$(el).attr('href')||$(el).attr('src');if(!raw||/^(mailto:|https?:|tel:|data:)/.test(raw))continue;
  const link=new URL(raw,'https://archive.london'+url);const pathname=decodeURIComponent(link.pathname);
  const target=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  check(target.startsWith(root+path.sep),`${url}: escaped root`);
  try{await fs.access(target);}catch{errors.push(`${url}: broken ${raw}`);}
  if(link.hash&&documents.has(pathname))check(documents.get(pathname)(`[id="${decodeURIComponent(link.hash.slice(1))}"]`).length,`${url}: missing fragment ${raw}`);
 }
 for(const el of $('[srcset]').toArray())for(const entry of $(el).attr('srcset').split(',')){const target=entry.trim().split(/\s+/)[0];try{await fs.access(root+target);}catch{errors.push(`${url}: missing srcset ${target}`);}}
}
const sitemap=load(await fs.readFile(root+'/sitemap.xml','utf8'),{xml:true});
const urls=sitemap('loc').map((_,e)=>sitemap(e).text()).get();
check(urls.length===register.length,'Sitemap count mismatch');
for(const p of register)check(urls.includes('https://archive.london'+p.path),`Missing sitemap route ${p.path}`);
const linked=new Set();for(const [,$] of documents)$('a[href^="/"]').each((_,e)=>linked.add(e.attribs.href.split(/[?#]/)[0]));
for(const p of register)check(linked.has(p.path),`Orphan ${p.path}`);
check(register.filter(p=>sources.some(s=>s.path===p.path)).length===sources.length,'Not all supplied pages rendered');
const openings=new Map(),paragraphs=new Map();const similarity=[];
const articles=sources.map(p=>{const $=documents.get(p.path);const body=$('article.prose').clone();body.find('.directory').remove();const text=body.text().toLowerCase();const words=text.match(/[a-z]+/g)||[];const grams=new Set(words.slice(0,-4).map((_,i)=>words.slice(i,i+5).join(' ')));const first=body.find('p').first().text();if(openings.has(first))warnings.push(`Repeated opening: ${p.path} and ${openings.get(first)}`);openings.set(first,p.path);body.find('p').each((_,e)=>{const para=$(e).text();if(para.length<180)return;const seen=paragraphs.get(para)||[];seen.push(p.path);paragraphs.set(para,seen);});return {p,grams};});
for(let i=0;i<articles.length;i++)for(let j=i+1;j<articles.length;j++){const a=articles[i],b=articles[j];const common=[...a.grams].filter(x=>b.grams.has(x)).length;const score=common/(a.grams.size+b.grams.size-common);similarity.push({a:a.p.path,b:b.p.path,jaccardFiveWord:Math.round(score*10000)/10000});if(score>.25)warnings.push(`High editorial similarity: ${a.p.path} / ${b.p.path}`);}
similarity.sort((a,b)=>b.jaccardFiveWord-a.jaccardFiveWord);
const duplicatedParagraphs=[...paragraphs].filter(([,v])=>v.length>1).map(([text,pages])=>({text,pages}));
const result={passed:errors.length===0,routeCount:register.length,sourceCount:sources.length,errors,warnings,stats,duplicatedParagraphs,schemaValidation:'Local JSON syntax, expected entity types, reference integrity and visible-content checks. Not an external rich-results certification.',externalReferences:['https://schema.org/CollectionPage','https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls']};
await fs.writeFile('reports/validation.json',JSON.stringify(result,null,2));
await fs.writeFile('reports/similarity.json',JSON.stringify({method:'Jaccard similarity of five-word editorial shingles, shared interface excluded',topPairs:similarity.slice(0,30),duplicatedParagraphs},null,2));
console.log(JSON.stringify({passed:result.passed,routes:register.length,sourcePages:sources.length,errors,warnings,highestSimilarity:similarity[0],duplicatedParagraphs:duplicatedParagraphs.length},null,2));
assert.equal(errors.length,0,'Static validation failed');
