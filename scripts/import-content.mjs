import fs from 'node:fs/promises';
import {parse} from 'yaml';

// Import the explicitly supplied batch only. Source notes never enter the public build.
const changes=[];
const pages=[];
const additionalNames={34:'Cats',35:'Candles and light',36:'Eyewear',37:'Stationery and writing',38:'Music objects and audio',39:'Books and publishing',41:'Art and artists’ materials',42:'Christmas'};
const names=['Archive.London','Photography archive','Robert Harper','Fashion','Jewellery','Beauty and cosmetics','Fragrance','Portraits','Musicians and bands','London','Scotland','Places and travel','Designer footwear','Handbags and bags','Watches','Food','Drinks','Interiors and design','Polaroids','Analogue photography','Motor racing','Aviation','Garden and botanical','Marine and superyachts','Kitchen and tableware','Bathroom and bathing','Hair and grooming','Toys and childhood','Sport','Landscapes','Corporate and technology','Weddings','Advertising'];
const edits=[
  [/The art page should connect those strands without claiming that every related image belongs to this precise inventory total\./g,'These strands connect art to the wider archive; related photographs outside this section are not included in its stated total.'],
  [/first published concert image/g,'first sold concert photograph'],
  [/Selected fashion photographs will be added as image review and digitisation progress\./g,'Fashion image selection can be discussed through a professional enquiry.'],
  [/Selected photographs will be published as review and digitisation continue\./g,'The online selection represents only part of the jewellery holdings.'],
  [/Selected beauty photographs will be introduced as suitable material is reviewed for publication\./g,'Beauty image selection is available through professional research enquiries.'],
  [/Selected fragrance photographs will be added following image review\./g,'Fragrance photographs can be researched by house, bottle or visual treatment.'],
  [/Selected street and location photographs will be published as review continues\./g,'Street and location material can be researched by place, subject and period.'],
  [/Selected images will be introduced after review and digitisation\./g,'Image availability and digitisation requirements can be discussed with the archive.'],
  [/Selected footwear images will be published following review\./g,'Footwear image selection can begin with a designer, shoe type or period.'],
  [/Selected photographs will be added as image review continues\./g,'Photographic selections can be discussed with the archive.'],
  [/Selected watch photographs will be published when the corresponding material has been reviewed and cleared for online presentation\./g,'Watch photographs can be researched by design, object or catalogue association.'],
  [/Selected images will appear online as review and digitisation progress\./g,'Please enquire about available food photographs and any digitisation required.'],
  [/Any individual event page must be built[^\n]+/g,'Circuit and championship references identify the subjects recorded in the catalogue; they do not establish a year or a race result for each photograph.'],
  [/The public page should allow the aircraft to be approached from several directions:/g,'The aircraft can be approached from several directions:'],
  [/Detailed captions must be based on image-level evidence\.[^\n]+/g,'Aircraft variants, airfields, personnel and dates require research into the individual photographs.'],
  [/The botanical page should therefore act as a connecting room rather than a sealed category\./g,'These connections extend the botanical collection into the wider archive.'],
  [/Archive\.London must not invent one\. A precise figure should be published only after file-level cataloguing identifies every relevant image\./g,'A separate marine total is not currently available.'],
  [/The page should evoke that world without falling into property-brochure language\. These are photographs by an established editorial artist, not listings for vessels\./g,'The photographs approach this world through Harper\x27s editorial practice.'],
  [/although individual marine images should not be attributed to that biography unless location evidence supports it/g,'while the location of each photograph remains a separate question for image research'],
  [/Individual pages should be created only where the photographs support a substantial treatment, and must avoid suggesting brand endorsement\./g,'The named products are photographic subjects; their inclusion does not imply endorsement.'],
  [/These connections should be used to build a sporting network across the site rather than forcing unrelated material into one page\./g,'These connections place sport within the wider fashion, portrait and motor-racing collections.'],
  [/Each claim must be confirmed at image level before detailed captions are published, but the group clearly records technology at moments of public emergence\./g,'The catalogue wording provides a starting point for research; identifying an individual device, date or development requires examination of the photographs.'],
  [/These relationships should shape the page\./g,''],
  [/The Marianna Asprey material introduces named social history, but individual identities, dates and locations must be confirmed before publication\. The editorial tone may be warm and socially observant without becoming speculative\./g,'The catalogue association with Marianna Asprey provides a starting point for research into the wedding material. Individual identities, dates and locations are subject to photographic review.'],
  [/Privacy and sensitivity must be considered before personal wedding images are displayed publicly\./g,'Access to personal wedding photographs is considered individually.'],
  [/Individual brand pages should be created[^\n]+/g,''],
  [/Individual designer pages should concentrate[^\n]+/g,''],
  [/Each subject page must remain anchored[^\n]+/g,''],
  [/These names must be presented with care\.[^\n]+/g,'Descriptions of individual sittings and performances are limited to the surviving photographic record.'],
  [/These names should be treated as subjects represented in the photographic inventory\. Their inclusion does not automatically establish that each house directly commissioned Harper\./g,'These fragrance houses are represented as photographic subjects. Their inclusion does not imply a direct commission or endorsement.'],
  [/Their appearance must be described accurately\. Unless a commission is independently confirmed, Archive\.London should state that the collection contains photographs of products associated with the brand, not that the brand was necessarily Harper\x27s client\./g,'These names identify products represented in the collection, rather than a confirmed client relationship in every case.'],
  [/These names describe objects represented in the archive\. Unless another reliable record confirms a direct commission, the page must not state that the designer or fashion house employed Harper\./g,'These names identify objects represented in the archive. Their inclusion does not imply a direct commission or endorsement.'],
  [/Archive\.London must distinguish between a photographed branded object and a confirmed client commission\. These pages concern material held in the archive\. They do not imply endorsement or an official relationship with every named house\./g,'The photographed objects are represented within the archive. Their inclusion does not imply endorsement, a direct commission or an official relationship with every named house.'],
  [/These documented series should receive individual editorial pages, with dates and locations included only where the inventory confirms them\./g,'Dates and locations are given where recorded in the supplied catalogue descriptions.'],
  [/Each reference requires careful cataloguing before publication\.[^\n]+/g,'These are catalogue associations. Personal ownership and the history of an individual timepiece are not established by a subject label alone.'],
  [/Steve McQueen's TAG Heuer Monaco watch/g,'a TAG Heuer Monaco watch associated in the catalogue with Steve McQueen'],
  [/This verified total combines/g,'This core total combines'],
  [/These references must be described according to the surviving material, without implying a commission where none is confirmed\./g,'These references identify subjects and locations; they do not establish a direct commission in every case.'],
  [/That cataloguing history should be corrected in the public structure without altering the source inventory\./g,'The Paris material is treated here as a distinct location.'],
  [/These images should be presented as a distinct regional study rather than absorbed into a generic page about Italy\./g,'These images form a distinct regional study within the Italian material.'],
  [/Any detailed page must be based on confirmed inventory or image evidence before publication\./g,'Further details can be requested through professional research enquiries.'],
  [/The travel archive should therefore preserve distinctions between commissioned work, landscape study, architecture, street observation and personal material\. Where those circumstances are not known, Archive\.London must say so rather than create a convenient story\./g,'Commissioned work, landscape studies, architecture, street observations and personal material have distinct contexts. The circumstances of individual photographs can be explored through a research enquiry.'],
  [/Place pages will be connected[^\n]+/g,'Places can be researched alongside their landscape, architectural and biographical connections within the wider archive.'],
  [/Cross-linking these records will help reconstruct[^\n]+/g,'Together, these records may help reconstruct the relationship between an isolated product photograph and its wider editorial story.'],
  [/Individual subject pages will be published[^\n]+/g,'Subject research focuses on Harper\x27s photographs and their recorded context.'],
  [/\bverified inventory\b/g,'catalogue descriptions'],
];
for(const filename of (await fs.readdir('content/source')).sort()){
  const raw=await fs.readFile('content/source/'+filename,'utf8');
  const [,front,body]=raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  const meta=parse(front);
  let copy=body.trim();
  for(const [pattern,replacement] of edits){copy=copy.replace(pattern,match=>{changes.push({file:filename,original:match,replacement,reason:'Convert production guidance to reader-facing language or qualify an unverified assertion.'});return replacement;});}
  copy=copy.replace(/[\u2013\u2014]/g,',').replace(/\n{3,}/g,'\n\n');
  if(filename.startsWith('15_')) meta.meta_description="Explore Robert Harper's watch photography, including designer timepieces, Swatch, Mackintosh-related designs and TAG Heuer Monaco catalogue material.";
  const index=Number(filename.slice(0,2))-1;
  const path=new URL(meta.url).pathname;
  const title=names[index]||additionalNames[index+1];
  if(!title)throw Error('Unregistered source file: '+filename);
  pages.push({id:path==='/'?'home':path.split('/').filter(Boolean).at(-1),path,title,pageType:meta.page_type,h1:meta.h1,metaTitle:meta.meta_title,metaDescription:meta.meta_description,ogTitle:meta.og_title||meta.meta_title,ogDescription:meta.og_description||meta.meta_description,related:(meta.related_pages||[]).map(p=>typeof p==='string'?{path:p}: {path:p.url,label:p.label}),body:copy});
  meta.source=filename;
  meta.sourceRows=[];
  meta.evidenceStatus='Owner-supplied editorial content; inventory totals not independently reconciled.';
  await fs.mkdir('content',{recursive:true});
  changes.push({file:filename,reason:'Imported full copy; page labels, UI instructions and heading scaffolding are rendered as their appropriate interface elements. Original source retained privately.',sourceWords:body.split(/\s+/).length});
  pages.at(-1).sourceFile=filename;
  pages.at(-1).catalogueFacts=Object.fromEntries(Object.entries(meta.inventory_evidence||{}).filter(([key,value])=>typeof value==='number'&&!/folder/i.test(key)));
}
await fs.writeFile('content/pages.json',JSON.stringify(pages,null,2)+'\n');
const privateRegister=[];
for(const filename of (await fs.readdir('content/source')).sort()){
  const raw=await fs.readFile('content/source/'+filename,'utf8');
  privateRegister.push({sourceFile:filename,...parse(raw.match(/^---\s*\n([\s\S]*?)\n---/)[1]),inventorySourceRows:[],evidenceStatus:'Supplied editorial assertions; source inventory reconciliation pending'});
}
await fs.writeFile('content/page-register.private.json',JSON.stringify(privateRegister,null,2));
await fs.mkdir('reports',{recursive:true});
await fs.writeFile('reports/editorial-changes.json',JSON.stringify(changes,null,2));
console.log(`Imported ${pages.length} supplied pages.`);
