import {navigation,footer} from './navigation.mjs';
import {metadata,enrich,optimise} from './seo.mjs';
import {homepage} from './homepage.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {marked} from 'marked';
import sharp from 'sharp';
import {load} from 'cheerio';

const base='https://archive.london';
const out='dist';
await fs.mkdir(out,{recursive:true});
await fs.mkdir('reports',{recursive:true});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const pages=JSON.parse(await fs.readFile('content/pages.json','utf8'));
const suppliedCount=pages.length;
const assignments=JSON.parse(await fs.readFile('content/image-assignments.json','utf8'));
const supplemental=[
  {id:'professional-access',path:'/professional-access/',title:'Professional access',pageType:'information',h1:'The right photograph begins with a conversation',metaTitle:'Research, Licensing and Professional Access | Archive.London',metaDescription:'Discuss photographic research, rights-managed licensing, exhibitions, publishing and digitisation with Archive.London.',body:`## Research and image selection\n\nArchive.London welcomes enquiries from picture researchers, publishers, editors, documentary producers, museums, galleries and creative teams. The Robert Harper Photograph Library comprises 95,487 unique photographs, including 52,684 analogue and 42,803 digital photographs. Online selections represent only part of the collection.\n\nTell us the subject, period or location you are researching, the project and its intended audience, your deadline and the kind of image required. Available catalogue descriptions and representative material can help establish whether the archive holds a suitable photograph.\n\n## Rights-managed licensing\n\nImage availability and permitted use are considered for each request. Please include the publication or production, media, territory, duration, anticipated circulation and any proposed cropping or alteration. Enquiry does not grant permission to reproduce an image.\n\n825 Ventures Ltd is the owner and rights holder of the Robert Harper Photograph Library, presented publicly as Archive.London. Any additional permissions required for a proposed use must be considered as part of the licensing discussion.\n\n## Exhibitions, publishing and cultural partnerships\n\nThe archive welcomes discussions about exhibitions, books, documentary projects, curated prints and cultural research. Proposals should describe the subject, intended format, partners, timescale and material sought.\n\n## Digitisation and stewardship\n\nThe collection includes analogue originals as well as digital photographs. Not every photograph has been digitised or is available for immediate delivery. Digitisation, cataloguing and preservation partnerships can be discussed with the archive.\n\n[Discuss a project]`},
  {id:'contact',path:'/contact/',title:'Contact',pageType:'contact',h1:'Tell us what you are looking for',metaTitle:'Contact Archive.London | Research and Image Enquiries',metaDescription:'Contact Archive.London about Robert Harper photographs, research requests, licensing, publishing, exhibitions and archive partnerships.',body:`## Professional enquiries\n\nFor research, licensing, publishing, exhibitions or partnership enquiries, please include your name, organisation, subject, intended use and deadline.\n\nEmail: [info@825ventures.online](mailto:info@825ventures.online)\n\nWhatsApp: [+44 7410 292347](https://wa.me/447410292347)\n\n## Archive.London\n\nHome of the Robert Harper Photograph Library. Owned by 825 Ventures Ltd.\n\nRegistered office: 128 City Road, London, United Kingdom, EC1V 2NX.\n\nOperating office: Office 7 (ground floor), 50 Canbury Park Road, Kingston upon Thames, KT2 6LX.\n\nPlease contact the archive before arranging access.\n\n[Professional access]`},
  {id:'rights-and-stewardship',path:'/rights-and-stewardship/',title:'Rights and stewardship',pageType:'information',h1:'A photographic archive held for the long term',metaTitle:'Rights and Archive Stewardship | Archive.London',metaDescription:'Ownership, image credits and professional use of the Robert Harper Photograph Library at Archive.London.',body:`## Ownership and identity\n\nArchive.London is the public identity of the Robert Harper Photograph Library, a privately held British photographic archive owned by 825 Ventures Ltd. Archive.London is not a public institution, museum or charity.\n\n## Image use and credits\n\nPhotographs are presented for discovery and professional research. Reproduction requires permission and agreement on the intended use. Publication on this website does not grant a licence to download, reproduce or distribute photographs.\n\nPhotograph by Robert Harper. Robert Harper Photograph Library, Archive.London.\n\n825 Ventures Ltd is the owner and rights holder.\n\n## Subjects and commissions\n\nNamed brands, designers and people identify photographic subjects. Their inclusion does not imply endorsement or affiliation. A photographed product is not, by itself, evidence of a commission from its manufacturer. Confirmed client relationships are distinguished from photographed subjects in the editorial descriptions.\n\n## Counts and access\n\nThe archive records 95,487 unique photographs and 177,143 total frames including variants and duplicates. A frame count is not a count of separate finished compositions. Subject collections can overlap and must not be added together to create an archive-wide total.\n\nThe online selection is an introduction to the holdings. Professional access, licensing, publishing, exhibitions, digitisation and long-term preservation can be discussed with the archive.\n\n[Professional access]\n\n[Discuss a project]`}
];
for(const p of supplemental) pages.push({...p,ogTitle:p.metaTitle,ogDescription:p.metaDescription,related:[]});
const byPath=new Map(pages.map(p=>[p.path,p]));
const collections=pages.filter(p=>p.path.startsWith('/photography-archive/')&&p.id!=='photography-archive');
const missing=[];
const imageDefs=[
 ['milleniumstar-noncorrected-02x.jpg','diamond-pendant-robert-harper','A pear-shaped diamond pendant suspended from a sculptural metal necklace against a grey-green background.','Diamond pendant and necklace.',['home','jewellery']],
 ['london-curzon.jpg','curzon-cinema-night-robert-harper','Light trails from passing traffic outside the illuminated Curzon cinema at night.','The Curzon cinema at night.',['london']],
 ['shopkeeper-newsagent-uk-1970s-robertharper-01.jpg','newsagent-portrait-robert-harper','A bespectacled shopkeeper leans on a newspaper counter in a shop lined with goods, in black and white.','Portrait at a newsagent’s counter.',['portraits']],
 ['t1760x2512-02118.jpg','fashion-silver-backdrop-robert-harper','A model in a pale sleeveless outfit stands before a reflective silver curtain.','Fashion study with a reflective backdrop.',['fashion']],
 ['gladius-aug07-focalpics-07108.jpg','motor-yacht-robert-harper','A motor yacht cuts through the water with a woman seated on its forward deck.','Motor yacht under way.',[]],
 ['christmas-focalpics-05.jpg','illuminated-angels-robert-harper','Illuminated angel figures with trumpets line a path towards a decorated Christmas tree at night.','Illuminated seasonal display.',[]],
 ['retro-tv-screens.jpg','television-screens-portrait-robert-harper','Two men in a dark interior before shelves of small glowing television screens.','Portrait with television screens.',[]],
 ['t2452x1701-02201.jpg','party-hats-fashion-robert-harper','Two women in colourful clothes and tall novelty hats pose together on patterned seating.','An editorial study with novelty hats.',[]],
 ['t2472x1701-03163.jpg','fire-engine-street-robert-harper','A red fire engine and emergency workers stand in a street beside a damaged building.','Street scene with a fire engine.',[]],
 ['t3309x2650-02342.jpg','yellow-sports-car-robert-harper','A woman poses beside a yellow sports car against a plain studio background.','Studio composition with a yellow sports car.',[]]
];
const images=[];
await fs.mkdir(out+'/assets/images',{recursive:true});
for(const [source,id,alt,caption,uses] of imageDefs){
 const input='assets/images/'+source;
 const info=await sharp(input).metadata();
 const widths=[480,960,1440].filter(w=>w<info.width); widths.push(Math.min(info.width,1440));
 const sizes=[...new Set(widths)].sort((a,b)=>a-b);
 for(const w of sizes)for(const fmt of ['webp','jpg']){
  const target=`${out}/assets/images/${id}-${w}.${fmt}`;
  try{await fs.access(target);}catch{await sharp(input).rotate().resize({width:w,withoutEnlargement:true}).toFormat(fmt==='jpg'?'jpeg':fmt,{quality:fmt==='jpg'?84:82}).toFile(target);}
 }
 images.push({id,alt,caption,uses,sizes,width:Math.max(...sizes),height:Math.round(info.height*Math.max(...sizes)/info.width),source});
}
const credit='Photograph by Robert Harper. Robert Harper Photograph Library, Archive.London.';
const imageUrl=im=>`/assets/images/${im.id}-${im.width}.jpg`;
function figure(im,eager=false){return `<figure><a href="${imageUrl(im)}" aria-label="View larger: ${esc(im.caption)}"><picture><source type="image/webp" srcset="${im.sizes.map(w=>`/assets/images/${im.id}-${w}.webp ${w}w`).join(', ')}" sizes="(max-width: 760px) 92vw, 48vw"><img src="${imageUrl(im)}" srcset="${im.sizes.map(w=>`/assets/images/${im.id}-${w}.jpg ${w}w`).join(', ')}" sizes="(max-width: 760px) 92vw, 48vw" width="${im.width}" height="${im.height}" alt="${esc(im.alt)}" loading="${eager?'eager':'lazy'}" decoding="async" ${eager?'fetchpriority="high"':''}></picture></a><figcaption>${esc(im.caption)}<span>${credit}</span></figcaption></figure>`;}
const fallbackLabels={
 '/photography-archive/jewellery/de-beers-diamonds/':'De Beers and diamonds',
 '/photography-archive/food-drink/':'Food and drink',
};
const topicFromPath=url=>fallbackLabels[url]||url.split('/').filter(Boolean).at(-1)?.replaceAll('-',' ')||'the archive';
function resolve(url,label,current){
 if(!url.startsWith('/'))return {url,label};
 const pathname=url.split(/[?#]/)[0];
 if(byPath.has(pathname)) return {url,label:label||byPath.get(pathname).title};
 const subject=label||topicFromPath(pathname);
 missing.push({page:current.path,requestedPath:pathname,subject,resolution:'Subject-specific professional enquiry'});
 return {url:'/contact/?subject='+encodeURIComponent(subject),label:'Enquire about '+subject.replace(/^Explore /i,'')};
}
const ctaRoutes=[
 [/archive|photographic archive/i,'/photography-archive/'],
 [/robert harper|biography/i,'/robert-harper-photographer/'],
 [/professional access/i,'/professional-access/'],
 [/beauty|cosmetics/i,'/photography-archive/beauty-cosmetics/'],
 [/designer footwear|footwear/i,'/photography-archive/designer-footwear/'],
 [/handbags/i,'/photography-archive/handbags/'],
 [/fashion/i,'/photography-archive/fashion/'],
 [/de beers|diamond/i,'/photography-archive/jewellery/de-beers-diamonds/'],
 [/jewellery/i,'/photography-archive/jewellery/'],
 [/fragrance/i,'/photography-archive/fragrance/'],
 [/eric clapton/i,'/photography-archive/music/eric-clapton-royal-albert-hall-1993/'],
 [/musicians|bands/i,'/photography-archive/music/'],
 [/portrait/i,'/photography-archive/portraits/'],
 [/new bond street/i,'/photography-archive/london/new-bond-street-1976/'],
 [/chelsea arts/i,'/photography-archive/london/chelsea-arts-club-1970s/'],
 [/london/i,'/photography-archive/london/'],
 [/scotland/i,'/photography-archive/scotland/'],
 [/places and travel/i,'/photography-archive/places-travel/'],
 [/polaroid/i,'/photography-archive/polaroids/'],
 [/analogue/i,'/photography-archive/analogue/'],
 [/interiors/i,'/photography-archive/interiors-design/'],
 [/food and drink/i,'/photography-archive/food/'],
 [/food/i,'/photography-archive/food/'],
 [/drinks/i,'/photography-archive/drinks/'],
 [/watches/i,'/photography-archive/watches/'],
 [/landscape/i,'/photography-archive/landscapes/'],
 [/luxury still life/i,'/photography-archive/luxury-still-life/'],
 [/hair and grooming/i,'/photography-archive/hair-grooming/'],
 [/travel accessories/i,'/photography-archive/travel-accessories/'],
 [/marine/i,'/photography-archive/marine-superyachts/'],
];
const knownBrands=['Chanel','Christian Dior','Prada','Gucci','Louis Vuitton','Burberry','Mulberry','Fendi','Givenchy','Valentino','Versace','Calvin Klein','Yves Saint Laurent','Jean Paul Gaultier','Jo Malone','Guerlain','Issey Miyake','Donna Karan','Nina Ricci','Rochas','Tommy Hilfiger','Paul Smith','Manolo Blahnik','Jimmy Choo','Christian Louboutin','Sergio Rossi','Kurt Geiger','Vivienne Westwood','Karen Millen','Emma Hope','Patrick Cox','Lulu Guinness','Anya Hindmarch','Paco Rabanne','Emilio Pucci','Moschino','Jasper Conran','Marc Jacobs','Chloé','Swatch','TAG Heuer','De Beers','Cinzano'];
const knownPeople=['David Bowie','David Gray','Eric Clapton','Paul McCartney','Van Morrison','Santana','Jethro Tull','Everything But The Girl','Laurie Anderson','Art Blakey','The Zombies','Colin Blunstone','Robert De Niro','Sir Bobby Charlton','Sir Hardy Amies','Ken Russell','Paul Whitehouse','Anthony Powell','Zerbanoo Gifford','Candida Crewe','Anton Lesser','Fali Pavri','The Who'];
knownPeople.push('Charlie Chaplin','Terence Bayler','Michael Palin','Steve McQueen','Marianna Asprey');
const knownPlaces=['London','Scotland','Glasgow','Islay','New Bond Street','Chelsea Arts Club','Royal Albert Hall','London Bridge','Jamaica','Paris','Rome','Villa Lante','Tuscany','Lucca','New York','Venice','Iceland',"Côte d'Azur"];
const mentions=(p,list)=>list.filter(x=>p.body.toLowerCase().includes(x.toLowerCase()));
for(const p of pages){
 metadata(p);
 p.hero=images.find(im=>im.id===assignments[p.id]);
 p.type=p.pageType==='place_collection'?'Places':p.pageType==='format_collection'?'Formats':'Categories';
 p.brands=mentions(p,knownBrands);p.people=mentions(p,knownPeople);p.places=mentions(p,knownPlaces);
 p.formats=mentions(p,['Analogue','Polaroid','Digital']);
 p.colours=mentions(p,['black-and-white','colour']);
 p.periods=mentions(p,['1960s','1970s','1974','1975','1976','1987','1993']);
 p.events=mentions(p,['Eric Clapton at the Royal Albert Hall in 1993','Art Blakey Big Band in Edinburgh in 1987','Jethro Tull in November 1974']);
}
function indexUI(){
 const filter=(key,label,values)=>`<label>${label}<select name="${key}"><option value="">All ${label.toLowerCase()}</option>${[...new Set(values)].sort().map(v=>`<option>${esc(v)}</option>`).join('')}</select></label>`;
 return `<section class="directory" id="collections" aria-labelledby="directory-title"><h2 id="directory-title">Find a collection</h2><form id="archive-search" action="/photography-archive/" method="get"><label class="search-label">Search the archive<input type="search" name="q" placeholder="Subject, person, designer, brand or place" aria-describedby="search-hint" autocomplete="off"></label><p id="search-hint">Search the collection descriptions. Try jewellery, Chanel, David Bowie, Scotland or perfume.</p><div class="search-enhanced" hidden><details><summary>Refine your search</summary><div class="filters">${filter('type','Collection types',collections.map(p=>p.type))}${filter('category','Categories',collections.map(p=>p.title))}${filter('brands','Brands and designers',collections.flatMap(p=>p.brands))}${filter('people','People and musicians',collections.flatMap(p=>p.people))}${filter('places','Places',collections.flatMap(p=>p.places))}${filter('events','Documented series',collections.flatMap(p=>p.events))}${filter('periods','Periods mentioned',collections.flatMap(p=>p.periods))}${filter('formats','Formats',collections.flatMap(p=>p.formats))}${filter('colours','Colour records',collections.flatMap(p=>p.colours))}${filter('availability','Image availability',['With selected images','Catalogue description only'])}${filter('letter','Initial letters',collections.map(p=>p.title[0]))}</div></details><p class="filter-note">Filters find subjects and formats mentioned in these collection descriptions; they do not assign dates or formats to every photograph.</p><div class="search-actions"><button type="submit">Search</button><button type="reset" class="secondary">Clear all filters</button></div></div><noscript><p>All collection links appear below. Interactive filtering requires JavaScript; you can also use your browser’s Find command.</p></noscript></form><p id="result-count" role="status" aria-live="polite">${collections.length} collections</p><div id="no-results" hidden><h3>No matching collection</h3><p>No published collection currently matches this search. The online index represents only part of the full archive. Try a broader term or <a href="/contact/">contact Archive.London with a professional research request</a>.</p></div><div id="collection-list">${collections.slice().sort((a,b)=>a.title.localeCompare(b.title)).map((p,i)=>`<article class="collection-row" data-id="${p.id}"><span class="row-number">${String(i+1).padStart(2,'0')}</span><div><p class="eyebrow">${p.type}</p><h3><a href="${p.path}">${esc(p.title)}</a></h3><p>${esc(p.metaDescription)}</p></div><span class="availability">${p.hero?'With selected images':'Catalogue description only'}</span></article>`).join('')}</div></section>`;
}
function renderCopy(p){
 let source=p.body.replace(/^# Page copy\s*/,'');
 // The first small heading is a page label; H1 comes from the supplied metadata.
 source=source.replace(/^## [^\n]+\n\s*(?=# )/,'').replace(/^# [^\n]+\n/m,'');
 if(p.id==='home')source=source.replace(/^## Hero\s*/,'').replace(/^\*\*Archive\.London\*\*\s*/,'').replace(/^# [^\n]+\n/m,'');
 if(p.id==='photography-archive')source=source.replace(/## Search interface text[\s\S]*?(?=## Principal collections)/,'<!--DIRECTORY-->\n\n');
 source=source.replace(/^## Closing statement\s*\n\s*### /m,'## ');
 source=source.replace(/^### Related collections[\s\S]*?(?=\n\[[^\n]+\]\s*$)/m,'');
 source=source.replace(/^\[([^\]\n]+)\]\s*$/gm,(_,label)=>{
   let url;
   if(/^(enquire|make a professional|discuss|submit)/i.test(label))url='/contact/?subject='+encodeURIComponent(p.title);
   else url=ctaRoutes.find(([re])=>re.test(label))?.[1];
   if(!url){missing.push({page:p.path,label,resolution:'Professional enquiry'});return `[Enquire about ${label.replace(/^Explore /i,'')}](/contact/?subject=${encodeURIComponent(label)})`;}
   const link=resolve(url,label,p);return `[${link.label}](${link.url})`;
 });
 const $=load(marked.parse(source),null,false);
 $('a').each((_,el)=>{const a=$(el),r=resolve(a.attr('href')||'',a.text(),p);a.attr('href',r.url);a.text(r.label);});
 let counter=0;const headings=[];
 $('h2,h3').each((_,el)=>{const h=$(el);const id=`section-${++counter}-${slug(h.text())}`;h.attr('id',id);headings.push({id,label:h.text(),level:el.tagName});});
 $('p').each((_,el)=>{const pnode=$(el);if(pnode.children().length===1&&pnode.children().first().is('a')&&pnode.text()===pnode.children().first().text())pnode.addClass('text-link');});
 return {html:$.html().replace('<!--DIRECTORY-->',''),headings};
}
const publicRegister=[];
for(const p of pages){
 const rendered=renderCopy(p);
 const breadcrumbs=[{label:'Archive.London',path:'/'}];
 if(p.path.startsWith('/photography-archive/')&&p.id!=='photography-archive')breadcrumbs.push({label:'Photography archive',path:'/photography-archive/'});
 if(p.path!=='/')breadcrumbs.push({label:p.title,path:p.path});
 const related=p.related.map(r=>resolve(r.path,r.label,p));
 const publishedRelated=related.filter(r=>!r.url.startsWith('/contact/?'));
 if(!publishedRelated.length&&collections.includes(p))publishedRelated.push({url:'/photography-archive/',label:'All collections'},{url:'/robert-harper-photographer/',label:'Robert Harper'});
 const graph=[
  {'@type':'Organization','@id':base+'/#organisation',name:'Archive.London',legalName:'825 Ventures Ltd',url:base+'/',description:'The public identity of the privately held Robert Harper Photograph Library, owned by 825 Ventures Ltd.'},
  {'@type':'WebSite','@id':base+'/#website',name:'Archive.London',url:base+'/',publisher:{'@id':base+'/#organisation'},inLanguage:'en-GB'},
  {'@type':'Person','@id':base+'/robert-harper-photographer/#person',name:'Robert Harper',jobTitle:'Photographer',url:base+'/robert-harper-photographer/'},
  {'@type':p.pageType==='biography'?'ProfilePage':p.pageType==='contact'?'ContactPage':p.pageType==='information'?'WebPage':'CollectionPage','@id':base+p.path+'#page',url:base+p.path,name:p.h1,description:p.metaDescription,inLanguage:'en-GB',isPartOf:{'@id':base+'/#website'},publisher:{'@id':base+'/#organisation'},...(p.pageType==='biography'?{mainEntity:{'@id':base+'/robert-harper-photographer/#person'}}:{about:p.pageType==='place_collection'?{'@type':'Place',name:p.title}:{'@type':'Thing',name:p.title==='Archive.London'?'The Robert Harper Photograph Library':p.title}}),...(p.path!=='/'?{breadcrumb:{'@id':base+p.path+'#breadcrumbs'}}:{}),...(p.hero?{primaryImageOfPage:{'@id':base+p.path+'#image'}}:{})}
 ];
 enrich(graph,p);
 graph.push({'@type':'BreadcrumbList','@id':base+p.path+'#breadcrumbs',itemListElement:breadcrumbs.map((b,i)=>({'@type':'ListItem',position:i+1,name:b.label,item:base+b.path}))});
 const list=p.id==='photography-archive'?collections.map(q=>({url:q.path,label:q.title})):publishedRelated;
 if(list.length){graph.push({'@type':'ItemList','@id':base+p.path+'#collections',name:p.id==='photography-archive'?'Photography collections':'Related collections',numberOfItems:list.length,itemListElement:list.map((q,i)=>({'@type':'ListItem',position:i+1,name:q.label,url:base+q.url}))});graph.find(g=>g['@id']===base+p.path+'#page')[p.id==='photography-archive'?'mainEntity':'mentions']={'@id':base+p.path+'#collections'};}
 const used=p.id==='home'?images:p.hero?[p.hero]:[];
 for(const im of used)graph.push({'@type':'ImageObject','@id':base+p.path+(im===p.hero?'#image':'#'+im.id),contentUrl:base+imageUrl(im),thumbnailUrl:base+`/assets/images/${im.id}-${im.sizes[0]}.jpg`,name:im.caption,description:im.alt,caption:im.caption,creator:{'@id':base+'/robert-harper-photographer/#person'},copyrightHolder:{'@id':base+'/#organisation'},creditText:credit,acquireLicensePage:base+'/professional-access/',width:im.width,height:im.height});
 const hero= `<header class="page-heading ${p.hero?'with-image':'type-only'}"><div><p class="eyebrow">${p.id==='home'?'The Robert Harper Photograph Library':esc(p.title)}</p><h1>${esc(p.h1)}</h1>${p.id==='home'?'<p class="hero-intro">Archive.London, home of the Robert Harper Photograph Library.</p><a class="button" href="/photography-archive/">Explore the archive</a>':`<p class="page-deck">${esc(p.metaDescription)}</p>`}</div>${p.hero?figure(p.hero,true):''}</header>`;
 const toc=rendered.headings.filter(h=>h.level==='h2');
 const relatedHTML=publishedRelated.length?`<section class="related"><p class="eyebrow">Continue exploring</p><h2>Related collections</h2><ul>${publishedRelated.map(r=>`<li><a href="${r.url}">${esc(r.label)}</a></li>`).join('')}</ul></section>`:'';
 const enquiry=collections.includes(p)?`<section class="enquiry"><p class="eyebrow">Research &amp; licensing</p><h2>Look further into ${esc(p.title.toLowerCase())}</h2><p>Selected images are available for professional research and licensing enquiries.</p><a class="button" href="/contact/?subject=${encodeURIComponent(p.title)}">Enquire about this collection</a></section>`:'';
 const contact=p.id==='contact'?'<aside class="contact-context" id="contact-context" hidden><p id="enquiry-subject"></p><a class="button" id="email-enquiry" href="mailto:info@825ventures.online">Email your enquiry</a></aside>':'';
 const gallery=p.id==='home'?`<section class="selected-work" id="gallery"><p class="eyebrow">The photographic record</p><h2>Selected photographs</h2><div class="gallery">${images.filter(im=>im!==p.hero).map(im=>figure(im)).join('')}</div></section>`:'';
 let html=`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(p.metaTitle)}</title><meta name="description" content="${esc(p.metaDescription)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${base+p.path}"><meta name="theme-color" content="#F8F6F2"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css"><meta property="og:type" content="website"><meta property="og:site_name" content="Archive.London"><meta property="og:locale" content="en_GB"><meta property="og:url" content="${base+p.path}"><meta property="og:title" content="${esc(p.ogTitle)}"><meta property="og:description" content="${esc(p.ogDescription)}"><meta name="twitter:card" content="${p.hero?'summary_large_image':'summary'}"><meta name="twitter:title" content="${esc(p.ogTitle)}"><meta name="twitter:description" content="${esc(p.ogDescription)}">${p.hero?`<meta property="og:image" content="${base+imageUrl(p.hero)}"><meta property="og:image:alt" content="${esc(p.hero.alt)}"><meta property="og:image:width" content="${p.hero.width}"><meta property="og:image:height" content="${p.hero.height}"><meta name="twitter:image" content="${base+imageUrl(p.hero)}"><meta name="twitter:image:alt" content="${esc(p.hero.alt)}">`:''}<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c')}</script><script src="/assets/site.js" defer></script></head><body class="page-${p.id}"><a class="skip" href="#main">Skip to content</a><header class="masthead"><a class="wordmark" href="/" aria-label="Archive.London home">Archive<span>.</span>London</a><nav aria-label="Primary"><a href="/photography-archive/" ${p.path.startsWith('/photography-archive/')?'aria-current="'+(p.id==='photography-archive'?'page':'true')+'"':''}>The archive</a><a href="/robert-harper-photographer/" ${p.id==='robert-harper-photographer'?'aria-current="page"':''}>Robert Harper</a><a href="/professional-access/" ${p.id==='professional-access'?'aria-current="page"':''}>Professional access</a><a href="/contact/" ${p.id==='contact'?'aria-current="page"':''}>Contact</a></nav></header><main id="main"><nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${breadcrumbs.map((b,i)=>`<li>${i===breadcrumbs.length-1?`<span aria-current="page">${esc(b.label)}</span>`:`<a href="${b.path}">${esc(b.label)}</a>`}</li>`).join('')}</ol></nav>${hero}${contact}${p.id==='photography-archive'?indexUI():''}<div class="reading-layout">${toc.length?`<aside class="contents"><details open><summary>On this page</summary><ol>${toc.map(h=>`<li><a href="#${h.id}">${esc(h.label)}</a></li>`).join('')}</ol></details></aside>`:''}<article class="prose" aria-label="${esc(p.title)}">${rendered.html}</article></div>${gallery}${relatedHTML}${enquiry}</main><footer><div><a class="wordmark" href="/">Archive<span>.</span>London</a><p>The Robert Harper Photograph Library</p></div><div><p>Archive.London is the public identity of the archive.<br>Owner and rights holder: 825 Ventures Ltd.</p><a href="/rights-and-stewardship/">Rights and stewardship</a><br><a href="mailto:info@825ventures.online">info@825ventures.online</a><br><a href="https://wa.me/447410292347">WhatsApp +44 7410 292347</a></div><p class="footer-small">© ${new Date().getUTCFullYear()} 825 Ventures Ltd. Registered office: 128 City Road, London, United Kingdom, EC1V 2NX.</p></footer></body></html>`;
 if(p.id==='home'){
  const homeFigure=(im,eager=false)=>figure(im,eager);
  html=html.replace(/<script src="\/assets\/site.js" defer><\/script>/,'');
  const header=html.match(/<header class="masthead">[\s\S]*?<\/header>/)[0];
  html=html.slice(0,html.indexOf('<header class="masthead">'))+homepage({header,hero:homeFigure(p.hero,true),figures:images.filter(im=>im!==p.hero).map(im=>homeFigure(im)).join(''),body:rendered.html})+'</body></html>';
  html=html.replace('Archive<span>.</span>London','ARCHIVE<span>.</span>LONDON');
 }
 if(p.id!=='home'){
  html=html.replace(/<header class="masthead">[\s\S]*?<\/header>/,navigation(p.path)+'<div class="site-scroll">').replace(/<footer>[\s\S]*?<\/footer>/,footer()+'</div>');
  html=html.replace(/<details(?: open)?>/g,'<div class="expanded-section">').replace(/<\/details>/g,'</div>').replace(/<summary>/g,'<p class="section-label">').replace(/<\/summary>/g,'</p>');
 }
 const dest=out+(p.path==='/'?'/index.html':p.path+'index.html');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,html);
 publicRegister.push({id:p.id,pageType:p.pageType,title:p.title,path:p.path,h1:p.h1,metaTitle:p.metaTitle,metaDescription:p.metaDescription,schemaType:graph.find(g=>g['@id']===base+p.path+'#page')['@type'],parent:collections.includes(p)?'/photography-archive/':'/',related:publishedRelated.map(r=>r.url),imageAvailability:p.hero?'With selected images':'Catalogue description only',heroImage:p.hero?imageUrl(p.hero):null,brands:p.brands,people:p.people,places:p.places,type:p.type,formats:p.formats,colours:p.colours,periods:p.periods,events:p.events,catalogueFacts:p.catalogueFacts||{},verifiedImageCount:null,searchText:load(rendered.html).text(),indexingStatus:'index',contentStatus:'complete'});
}
await fs.mkdir(out+'/assets',{recursive:true});
await fs.cp('site/fonts',out+'/assets/fonts',{recursive:true});
for(const f of ['site.css','site.js','favicon.svg'])await fs.copyFile('site/'+f,out+'/assets/'+f);
await fs.writeFile(out+'/assets/page-register.json',JSON.stringify(publicRegister));
await fs.writeFile(out+'/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p=>`<url><loc>${base+p.path}</loc></url>`).join('')}</urlset>`);
await fs.writeFile(out+'/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
await fs.writeFile(out+'/404.html',`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Page not found | Archive.London</title><link rel="stylesheet" href="/assets/site.css"></head><body><main class="not-found"><a class="wordmark" href="/">Archive.London</a><p class="eyebrow">404</p><h1>This page is not in the collection</h1><p>Explore the archive index or contact us about the subject you are researching.</p><a class="button" href="/photography-archive/">Explore the archive</a> <a href="/contact/">Contact Archive.London</a></main></body></html>`);
await fs.writeFile('reports/link-resolutions.json',JSON.stringify(missing,null,2));
const notFound=await fs.readFile(out+'/404.html','utf8');await fs.writeFile(out+'/404.html',notFound.replace('<body>','<body>'+navigation('/missing-collection/')+'<div class="site-scroll">').replace('</body>',footer()+'</div></body>'));
await fs.writeFile('reports/build-summary.json',JSON.stringify({pages:pages.length,suppliedPages:suppliedCount,collectionPages:collections.length,byType:Object.fromEntries([...new Set(pages.map(p=>p.pageType))].map(t=>[t,pages.filter(p=>p.pageType===t).length])),pagesWithImages:pages.filter(p=>p.hero).length,unillustratedCollectionPages:collections.filter(p=>!p.hero).length,existingImagesPreserved:images.length,unavailableLinkedRoutes:[...new Set(missing.map(r=>r.requestedPath).filter(Boolean))],inventoryReconciliation:'Pending source inventory; numbers originate in supplied copy.'},null,2));
console.log(`Built ${pages.length} pages, ${collections.length} collections and ${images.length} responsive image sets.`);




await optimise(pages,images);
