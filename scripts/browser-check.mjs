import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4173';
const records=JSON.parse(await fs.readFile('dist/assets/page-register.json','utf8'));
const collectionCount=records.filter(p=>p.parent==='/photography-archive/').length;
const browser=await chromium.launch({headless:true,channel:'chrome'});
const failures=[],results=[],consoleErrors=[];
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.on('pageerror',e=>consoleErrors.push(e.message));
for(const record of records){
 const response=await page.goto(base+record.path,{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);
 assert.equal(response.status(),200);
 await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});
 const axe=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||[...document.querySelectorAll('.site-scroll,.homepage-scroll,.home-navigation')].some(e=>e.scrollWidth>e.clientWidth+1));
 const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src));
 if(axe.violations.length||overflow||broken.length)failures.push({path:record.path,violations:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),overflow,broken});
 const perf=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoadedMs:Math.round(n.domContentLoadedEventEnd),loadMs:Math.round(n.loadEventEnd),resources:performance.getEntriesByType('resource').length,transferredBytes:performance.getEntriesByType('resource').reduce((s,r)=>s+r.transferSize,0)};});
 results.push({path:record.path,axeViolations:axe.violations.length,overflow,brokenImages:broken.length,localPerformance:perf});
}
// Verify the complete-image homepage on both screen sizes, including the CSS-only motion control.
for(const width of [1440,390]){
 await page.setViewportSize({width,height:900});await page.goto(base+'/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('details').count(),0);
 assert.equal(await page.locator('script:not([type="application/ld+json"])').count(),0);
 const layout=await page.evaluate(()=>{const imgs=[...document.querySelectorAll('main img')];return imgs.every(im=>{const r=im.getBoundingClientRect(),c=getComputedStyle(im);return r.height<=innerHeight*.9+1&&r.width<=innerWidth&&c.objectFit==='contain'&&c.transform==='none';})&&document.querySelector('.year-strip').getBoundingClientRect().top>=document.querySelector('.hero-photograph img').getBoundingClientRect().bottom;});assert(layout);
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.year-sequence span').first().evaluate(e=>getComputedStyle(e).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
}
await page.setViewportSize({width:1440,height:1000});
await page.goto(base+'/photography-archive/',{waitUntil:'networkidle'});
await page.locator('[name="q"]').fill('Chanel');
assert((await page.locator('.collection-row:visible').count())>0);
assert((await page.locator('.collection-row:visible').count())<collectionCount);
await page.locator('[name="q"]').fill('no-such-collection-938293');
assert(await page.locator('#no-results').isVisible());
await page.locator('button[type="reset"]').click();
await page.waitForFunction(n=>document.querySelector('#result-count').textContent===`${n} collections`,collectionCount);

await page.locator('[name="brands"]').selectOption('Chanel');
assert((await page.locator('.collection-row:visible').count())>0);
await page.reload({waitUntil:'networkidle'});
assert.equal(await page.locator('[name="brands"]').inputValue(),'Chanel');
await page.locator('button[type="reset"]').click();
await page.waitForFunction(n=>document.querySelector('#result-count').textContent===`${n} collections`,collectionCount);

await page.locator('[name="formats"]').selectOption('Polaroid');
assert((await page.locator('.collection-row:visible').count())>0);
await page.locator('button[type="reset"]').click();
await page.goto(base+'/contact/?subject=Jewellery',{waitUntil:'networkidle'});
assert.equal(await page.locator('#enquiry-subject').textContent(),'Research enquiry: Jewellery');
assert((await page.locator('#email-enquiry').getAttribute('href')).includes('Jewellery'));
await page.goto(base+'/#inventory',{waitUntil:'networkidle'});
await page.locator('.home-navigation a').filter({hasText:'Categories'}).click();
await page.waitForURL('**/photography-archive/');
const missing=await page.goto(base+'/missing-collection/');assert.equal(missing.status(),404);assert.equal(await page.locator('h1').textContent(),'This page is not in the collection');
await page.goto(base+'/',{waitUntil:'networkidle'});await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Skip to content');
const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
const simple=await nojs.newPage();await simple.goto(base+'/photography-archive/');assert.equal(await simple.locator('.collection-row:visible').count(),collectionCount);
await simple.locator('h3 a').filter({hasText:'Aviation'}).click();assert((await simple.locator('h1').textContent()).includes('Aviation'));
await nojs.close();
for(const width of [390,320]){
 await page.setViewportSize({width,height:844});
 for(const record of records){await page.goto(base+record.path,{waitUntil:'domcontentloaded'});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1||[...document.querySelectorAll('.site-scroll,.homepage-scroll,.home-navigation')].some(e=>e.scrollWidth>e.clientWidth+1));if(overflow)failures.push({path:record.path,width,overflow});}
}
for(const [name,url,width,height] of [['home-desktop','/',1440,1000],['index-desktop','/photography-archive/',1440,1000],['fashion-desktop','/photography-archive/fashion/',1440,1000],['home-mobile','/',390,844],['index-mobile','/photography-archive/',390,844]]){
 await page.setViewportSize({width,height});await page.goto(base+url,{waitUntil:'networkidle'});await page.screenshot({path:`reports/${name}.png`,fullPage:false});
}
await page.setViewportSize({width:390,height:844});await page.goto(base+'/photography-archive/',{waitUntil:'networkidle'});await page.addScriptTag({path:'node_modules/axe-core/axe.min.js'});const mobileAxe=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));if(mobileAxe.violations.length)failures.push({mobileAxe:mobileAxe.violations});
await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
await browser.close();
await fs.writeFile('reports/browser-validation.json',JSON.stringify({passed:failures.length===0&&consoleErrors.length===0,pagesTested:records.length,failures,consoleErrors,results,checks:['Desktop axe WCAG A/AA automated scan on all pages','320px and 390px horizontal overflow checks on all pages','Search, no results, reset, brand and format filters','URL filter restoration','No-JavaScript navigation','Keyboard skip link','Prefilled contact enquiry','404 status','Legacy hash navigation','Reduced motion'],limitations:'Local timing observations are not field Core Web Vitals or Lighthouse certification. Automated accessibility checks do not establish full WCAG conformance.'},null,2));
console.log(JSON.stringify({pages:records.length,failures,consoleErrors},null,2));
assert.equal(failures.length+consoleErrors.length,0);

