import fs from 'node:fs/promises';
import {parse} from 'yaml';

// Import the explicitly supplied batch only. Source notes never enter the public build.
const changes=[];
const pages=[];
const routeAliases={'parties-and-entertaining':'parties-entertaining','food-photography':'food','wedding-photography':'weddings','interiors-and-design':'interiors-design','art-and-artists-materials':'art','fragrance-photography':'fragrance','beauty-cosmetics-photography':'beauty-cosmetics','fashion-photography':'fashion','corporate-technology-photography':'corporate-technology'};
function normaliseRoute(path){
  if(!path.startsWith('/archive/'))return path;
  const slug=path.split('/').filter(Boolean).at(-1);
  if(slug==='de-beers-diamonds-millennium-star')return '/photography-archive/jewellery/de-beers-diamonds/';
  return '/photography-archive/'+(routeAliases[slug]||slug)+'/';
}
Object.assign(routeAliases,{'jewellery-photography':'jewellery','portrait-photography':'portraits','sports-photography':'sport','london-photography':'london','bathroom-and-bathing':'bathroom-bathing','musicians-and-bands':'music'});
const collectionGroups=[{start:78,end:87,id:'garden-botanical',label:'Garden and botanical'},{start:88,end:99,id:'hair-grooming',label:'Hair and grooming'}];
collectionGroups.push({start:100,end:129,id:'interiors-design',label:'Interiors and design'});
collectionGroups.push({start:130,end:139,id:'jewellery',label:'Jewellery'});
Object.assign(routeAliases,{'hair-and-grooming':'hair-grooming'});
Object.assign(routeAliases,{'optics-and-seeing':'optics','clocks-and-timepieces':'clocks','music-objects-and-audio':'music-audio'});
Object.assign(routeAliases,{'beach-and-pool-life':'beach-pool','drinks-photography':'drinks','crime-and-detection':'crime-detection','candles-and-light':'candles-light','religion-and-occult':'religion-occult','fireworks-and-night-scenes':'fireworks-night'});
Object.assign(routeAliases,{'toys-and-childhood':'toys-childhood','kitchen-and-tableware':'kitchen-tableware','haberdashery-and-textiles':'haberdashery-textiles','silver-and-decorative-objects':'silver-objects','gifts-and-wrapping':'gifts-wrapping','stationery-and-writing':'stationery-writing','books-and-publishing':'books-publishing','bedrooms-and-sleep':'bedrooms-sleep'});
function readSource(raw,filename,record=false){
  raw=raw.replace(/\r\n/g,'\n');
  const frontmatter=raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if(frontmatter)return {meta:parse(frontmatter[1]),body:frontmatter[2]};
  const field=name=>raw.match(new RegExp('^\\*\\*'+name+':\\*\\* (.+)$','m'))?.[1];
  const h1=raw.match(/^# (.+)$/m)?.[1];
  const suggested=field('Suggested URL')?.replaceAll('`','');
  const title=field('Meta title'),description=field('Meta description');
  const unique=raw.match(/\*\*Unique shots:\*\* (\d+)/)?.[1];
  const frames=raw.match(/\*\*Total frames(?: and variants)?:\*\* (\d+)/)?.[1];
  const relatedSection=raw.match(/## Related Archive\.London collections\n([\s\S]*?)(?=\n## |$)/)?.[1];
  const schema=raw.match(/## Structured data\s*```json\s*([\s\S]*?)```/)?.[1];
  if(!h1||!suggested||!title||!description||!unique||!frames||!relatedSection||!schema)throw Error('Incomplete labelled Markdown source: '+filename);
  const suppliedSchema=JSON.parse(schema);
  if(suppliedSchema.numberOfItems!==Number(unique))throw Error('Source count mismatch: '+filename);
  const related=[...relatedSection.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map(([,label,url])=>({label,url:normaliseRoute(url)}));
  const sourceNumber=Number(filename.match(/^\d+/)?.[0]);
  const group=collectionGroups.find(g=>sourceNumber>=g.start&&sourceNumber<=g.end);
  if(group&&!related.some(r=>r.url==='/photography-archive/'+group.id+'/'))related.push({label:group.label,url:'/photography-archive/'+group.id+'/'});
  let body=raw.slice(raw.indexOf('\n## ')+1).split('\n## Related Archive.London collections')[0];
  body=body.replace(/^- \*\*Physical location:\*\*[^\n]*\n/gm,'');
  if(record)changes.push({file:filename,reason:'Read labelled Markdown metadata; keep image guidance, sample schema and storage locations in private source; render related collections through the site template.',originalSuggestedPath:suggested,publishedPath:normaliseRoute(suggested)});
  return {meta:{url:'https://archive.london'+normaliseRoute(suggested),h1,meta_title:title,meta_description:description,page_type:'subject_collection',related_pages:related,inventory_evidence:{unique_images:Number(unique),total_frames:Number(frames)},suppliedSchema},body};
}
const additionalNames={34:'Cats',35:'Candles and light',36:'Eyewear',37:'Stationery and writing',38:'Music objects and audio',39:'Books and publishing',41:'Art and artists’ materials',42:'Christmas',43:'Telephones and communication',44:'Transport',45:'Water and underwater',46:'Travel goods and accessories',47:'Silver and decorative objects',48:'Smoking and tobacco culture',49:'Parties and entertaining',50:'Bedrooms and sleep',51:'Pet accessories'};
Object.assign(additionalNames,{52:'Gifts and wrapping',53:'Haberdashery and textiles',54:'Medical objects',55:'Money and credit',56:'Office life',57:'Optics and seeing',58:'Religion and ritual',59:'Shells, pebbles and fossils',60:'Umbrellas, canes and fans'});
Object.assign(additionalNames,{61:'Antiques and historic objects',62:'Cameras and film',63:'Film memorabilia and stars',64:'Newspapers and press',65:'Television, video and DVD',66:'Clocks and timepieces',67:'Awards and trophies',68:'Badges, pins and insignia'});
Object.assign(additionalNames,{69:'Beach and pool life',70:'Bicycles and cycling',71:'Camping and outdoor life',72:'Crime and detection',73:'DIY, tools and construction',74:'Easter',75:'Fire, flames and fireplaces',76:'Fireworks and night scenes',77:'Gambling and games of chance'});
Object.assign(additionalNames,{78:'Garden ornament, barbecues and outdoor details',79:'Flower bouquets and arrangements',80:'Dried, artificial and withered flowers',81:'Flowers and botanical studies',82:'Single flowers and buttonholes',83:'Garden furniture and outdoor living',84:'Leaves and foliage studies',85:'Garden pots and planters',86:'Potted plants and indoor greenery',87:'Garden tools and equipment'});
Object.assign(additionalNames,{88:'Hair clips, grips and pins',89:'Hair combs, pins and hairstyles',90:'Hair ties and elastics',91:'Headbands',92:'Fascinators, extensions and styling accessories',93:'Barber shops and barbering culture',94:'Hair brushes and combs',95:'Hair colourants and dye',96:'Hair dryers and electrical styling appliances',97:'Shampoo and conditioner',98:'Hair styling products',99:'Hair treatments'});
Object.assign(additionalNames,{100:'Animal ornaments and decorative objects',101:'Baskets and bins',102:'Decorative bowls, dishes and plates',103:'Boxes, storage and trinket boxes',104:'Designer chairs, sofas and chaise longues',105:'Cupboards, screens and magazine racks',106:'Curtains, hangings and interior textiles',107:'Cushions and bolsters',108:'Door handles, letterboxes and house numbers',109:'Doormats and boot scrapers'});
Object.assign(additionalNames,{110:'Domestic fabrics and interior textiles',111:'Electric fans and domestic cooling',112:'Decorative glassware, bottles and vases',113:'Keys, padlocks, hooks and hangers',114:'Incense and pot pourri',115:'Lamps and domestic lighting I',116:'Lamps and domestic lighting II',117:'Lampshades, fairy lights and light pulls',118:'Lamps and lampshades',119:'Glass, paper and metal lanterns'});
Object.assign(additionalNames,{120:'Laundry, linen and washing',121:'Light switches and domestic electricity',122:'Mirrors and reflection',123:'Hand warmers, heaters and household curiosities',124:'Ornaments and decorative objects',125:'Picture frames and prints',126:'Rugs and throws',127:'Stools and bar stools',128:'Storage, shelving and magazine racks',129:'Tables and table settings'});
Object.assign(additionalNames,{130:'Decorative beads',131:'Bracelets and bangles, collection I',132:'Bracelets and bangles, collection II',133:'Brooches and pins',134:'Cufflinks and men’s jewellery',135:'De Beers diamonds and the Millennium Star',136:'Earrings, collection I',137:'Studs and small drop earrings',138:'Jewellery collections and group studies',139:'Jewellery, trinkets and unclassified pieces'});
const names=['Archive.London','Photography archive','Robert Harper','Fashion','Jewellery','Beauty and cosmetics','Fragrance','Portraits','Musicians and bands','London','Scotland','Places and travel','Designer footwear','Handbags and bags','Watches','Food','Drinks','Interiors and design','Polaroids','Analogue photography','Motor racing','Aviation','Garden and botanical','Marine and superyachts','Kitchen and tableware','Bathroom and bathing','Hair and grooming','Toys and childhood','Sport','Landscapes','Corporate and technology','Weddings','Advertising'];
const edits=[
  [/Their small number makes them suited to a focused page that values close looking over scale\./g,'This small holding invites close study of individual beads and their arrangement.'],
  [/On this page, however, the De Beers association is not simply career context\./g,'Within this collection, the De Beers association extends beyond career context.'],
  [/Archive\.London should present that wording faithfully and undertake frame-level cataloguing before adding further specifications, dates or campaign claims\. This restraint protects the credibility of the material and makes verified discoveries more valuable\./g,'The catalogue wording provides a starting point for frame-level research. Further specifications, dates and campaign connections remain to be established from the photographs and accompanying records.'],
  [/The page can confidently establish that standing without claiming a De Beers origin for earrings lacking specific documentation\./g,'That career history does not establish a De Beers origin for earrings lacking specific documentation.'],
  [/Individual group images should receive brand attribution only after frame-level research\./g,'Brand attribution for individual group images remains subject to frame-level research.'],
  [/Archive\.London should present the group studies as complete visual essays, not merely crop them into isolated products\./g,'The group studies can be researched as complete compositions, including the relationships between individual pieces.'],
  [/Archive\.London can make uncertainty transparent through careful captions, high-resolution study and future cataloguing updates\./g,'Object identities can be explored through detailed study of the photographs and further cataloguing.'],
  [/a precise group whose depth suggests careful exploration of angle, surface and operation/g,'a focused group whose angles, surfaces and operation can be researched through the individual photographs'],
  [/Archive\.London should embrace the category’s curiosity while preserving evidential restraint\. Objects may be researched further from the original frames, but no identity, maker or date should be invented for the sake of a more dramatic caption\./g,'The original frames provide a starting point for researching these unusual objects. Individual identities, makers and dates remain subject to that research.'],
  [/Archive\.London should use this category to reinforce its heritage mission\./g,'The collection connects the archive to the history of photographic display.'],
  [/On this page they also invite a larger question/g,'They also invite a larger question'],
  [/before the complete dematerialisation of music and print/g,'as music and print increasingly moved into digital formats'],
  [/Archive\.London’s presentation should retain visible books, discs and magazines where rights allow, since context transforms storage from an empty product into cultural history\./g,'Books, discs and magazines visible in the photographs can help establish how the storage was used and its wider cultural context.'],
  [/Its frame depth preserves detailed refinements in placement, light and tabletop arrangement\./g,'The frame total records the broader set of exposures, providing material for research into placement, light and tabletop arrangement.'],
  [/Archive\.London should present these photographs as heritage scenes rather than catalogue products\./g,'These photographs record the social and design contexts of tables and entertaining.'],
  [/The category should not be inflated into a particular brand commission without evidence\./g,'The category description does not establish a particular brand commission.'],
  [/Archive\.London should present the collection as a meeting of material and expertise\./g,'The collection brings together material and photographic expertise.'],
  [/No individual incense image should be assigned to them without further evidence\./g,'Those career connections do not establish a client for an individual incense photograph.'],
  [/This professional relationship matters particularly on a page about lighting\./g,'This professional relationship is particularly relevant to the lighting photographs.'],
  [/Archive\.London can position this as a heritage study by a photographer trained among internationally recognised names and published across leading magazines\./g,'This heritage study belongs to the work of a photographer trained among internationally recognised names and published across leading magazines.'],
  [/The unusually rich frame depth preserves detailed experimentation with angle, glow and proportion\./g,'The frame total records the broader set of exposures; the counts alone do not establish how angle, glow or proportion varied.'],
  [/Archive\.London can use related frames to show Harper’s working intelligence rather than offering a single decontextualised product shot\./g,'Related frames offer material for researching Harper’s working process alongside the individual product photographs.'],
  [/Archive\.London should make that connection as career context, without attributing an unidentified basket or bin to either retailer\./g,'This career context does not establish a retailer or commission for an unidentified basket or bin.'],
  [/Archive\.London should resist the flatness of catalogue presentation\./g,'The collection presents furniture through Harper’s editorial approach.'],
  [/Archive\.London can therefore position the collection at the meeting point of clothing, interiors and editorial image making, supported by evidence rather than loose analogy\./g,'The collection connects clothing, interiors and editorial image making through Harper’s work with fabric, texture and light.'],
  [/For AI research and visual search, accurate category language combined with Harper’s authorship and career context makes the material discoverable without reducing it to stock imagery\./g,'The catalogue descriptions and Harper’s career context provide starting points for research into individual photographs.'],
  [/Archive\.London can position this collection as visual evidence of designed British life\./g,'The collection offers visual evidence of designed British life.'],
  [/It is a small category with an unusually strong frame depth, suggesting sustained attention to angle, wording, texture and setting\./g,'It is a small category with a larger set of recorded frames. The counts alone do not establish how angle, wording, texture or setting varied.'],
  [/Archive\.London should present the group with warmth and wit while retaining provenance\./g,'The group combines domestic humour with a record of everyday design.'],
  [/The ratio of frames to finished ideas preserves subtle decisions of angle and placement, particularly important for an object whose effect changes completely when worn\./g,'The frame count records the broader set of exposures. Angle and placement can be explored through the photographs, particularly for an accessory whose effect changes when worn.'],
  [/The relationship should be understood as a formative professional apprenticeship, not a vague stylistic comparison\./g,'This was a formative professional apprenticeship.'],
  [/Archive\.London should present the sequence with the respect due to a piece of lived history\./g,'The collection is presented as a record of lived history.'],
  [/although Archive\.London should not assign any unlabelled brush photograph to a particular client/g,'although this career history does not identify the client for an unlabelled brush photograph'],
  [/It should not be used to label individual colourant images unless original documentation makes the link, a distinction that enhances Archive\.London’s credibility\./g,'Individual colourant photographs require their own documentation to establish a client connection.'],
  [/Archive\.London should foreground that provenance\./g,'That career context informs the collection.'],
  [/Archive\.London should retain the distinction between this career context and any specific product attribution that has not yet been verified from labels or job records\./g,'This career context does not establish a specific product attribution; labels and job records provide the starting point for that research.'],
  [/This is precisely how Archive\.London can become referencable: by joining verified biography, accurate provenance and intelligent cultural interpretation, rather than treating images as interchangeable stock\./g,'The collection connects Harper’s biography and catalogue records with cultural research into hair, music and identity.'],
  [/a physical location, a verified count and a biography/g,'a recorded catalogue count and a biography'],
  [/The high ratio of frames to compositions also preserves Harper’s process as he adjusted angle, light and arrangement\./g,'The frame total records the broader set of exposures; the counts alone do not establish how angle, light or arrangement changed.'],
  [/It should not be presented as a miscellaneous floral download\. Archive\.London can use the related frames to show sequence and refinement, inviting viewers to appreciate the choices behind a finished composition\./g,'The related frames offer material for researching sequence and refinement, and the choices behind a finished composition.'],
  [/Those images should be linked rather than added to the dedicated bicycle total\./g,'Those images remain part of the separate sports holdings and are not included in the dedicated bicycle total.'],
  [/The inventory describes camping goods broadly, so detailed product types should be identified from the images before individual subpages are created\./g,'The inventory describes camping goods broadly; individual product types can be researched through the photographs.'],
  [/It is a small category, and its precise subjects must be established by image review before the public page offers more detailed claims\./g,'It is a small category whose precise subjects remain questions for image-level research.'],
  [/## A page built on context, not exaggeration/g,'## The photographs in context'],
  [/Because the verified image count is limited, this page must not inflate the collection with generic crime history\. Its value lies in careful description of the surviving photographs and intelligent links to related material involving technology, money, medicine, London and corporate activity\./g,'The collection can be researched alongside related material involving technology, money, medicine, London and corporate activity. The surviving photographs provide the starting point for identifying its particular subjects.'],
  [/Images involving crime must be captioned carefully and without sensationalism\. The site should not infer offences, victims or locations from visual suggestion alone\./g,'The category label does not establish an offence, a victim or a location for any individual photograph. Identification depends on the image and its accompanying records.'],
  [/Product names and dates should be derived from visible evidence\./g,'Product names and dates can be researched through visible details and accompanying records.'],
  [/Those related categories should be linked without merging their independent totals\./g,'Those related categories retain their independent totals.'],
  [/These categories should be connected without adding their figures to the dedicated fire total\./g,'These connected categories retain their separate counts and are not added to the dedicated fire total.'],
  [/The close relationship between unique images and total frames indicates a broad sequence rather than extensive duplication\./g,'These counts distinguish the unique photographs from the total recorded frames; they do not, by themselves, establish how the images were sequenced.'],
  [/The inventory does not identify individual games, locations or participants, so these details must be established through image review rather than assumption\./g,'The inventory does not identify individual games, locations or participants. Those details remain subjects for image-level research.'],
  [/These related pages should be linked, but their counts must not be merged with the dedicated gambling total\. A concise, accurate page is more valuable than a larger one built from uncertain categories\./g,'These related collections provide context while retaining separate counts from the dedicated gambling holding.'],
  [/The page should treat gambling as cultural and social history, not promote it or imply guaranteed success\. Images should be captioned according to verified content and context\./g,'The photographs are presented as cultural and social history. Individual games, settings and participants can be researched through the surviving images and records.'],
  [/The Berlin Wall fragment should be presented with restraint\. Image-level review must establish what accompanying information survives before the website states provenance, date or location\. The verified inventory wording supports the subject, but no further history should be invented\./g,'The fragment is described in the supplied catalogue as a piece of the Berlin Wall. Its individual history, date and location require examination of the photograph and any accompanying records.'],
  [/Historic claims must always be tied to verified catalogue evidence\./g,'The history of an individual object can be researched through its catalogue entry and accompanying material.'],
  [/The inventory description is broad, so individual names and objects must be confirmed through image review before detailed pages are published\./g,'The inventory description is broad; individual names and objects remain subjects for image-level research.'],
  [/These photographs should be connected editorially without merging their category totals\./g,'These photographs connect to the cinema collection while retaining their separate category totals.'],
  [/That object may justify a dedicated page after its documentation has been reviewed, but the inventory label alone should not be expanded into an unsupported provenance story\./g,'The catalogue association offers a starting point for research, rather than establishing the object\x27s personal ownership or history.'],
  [/Any visible headline, date or publication should be transcribed accurately from the image rather than assumed\./g,'Headlines, dates and publication details can be researched through the visible printed material.'],
  [/The number of frames indicates careful variation around a small group of subjects, though individual award identities must be confirmed through image review\./g,'The frame total records the broader set of exposures. Individual award identities remain subjects for image-level research.'],
  [/Where related portraits or corporate photographs can be identified, the site should connect them through verified internal links\./g,'Related portrait and corporate collections provide further contexts for researching recognition and ceremony.'],
  [/Captions must identify specific trophies only where evidence is clear\./g,'The identity of a specific trophy can be researched through the photographs and accompanying records.'],
  [/Individual insignia must be identified carefully from visible evidence\. The site should not infer an organisation, date or political meaning from resemblance alone\./g,'Identifying individual insignia requires close examination of their visible detail and accompanying records. Resemblance alone does not establish an organisation, date or political meaning.'],
  [/Its relatively high frame count reflects the careful adjustments required to make folds, ties, boxes and reflective paper appear effortless\./g,'The frame count records the larger set of exposures, distinct from the number of unique photographs. Folds, ties, boxes and reflective paper give the collection its visual detail.'],
  [/The archive should present these photographs historically and responsibly\. It must not attach medical advice, efficacy claims or diagnoses that are absent from the source material\./g,'These photographs document historical material and the visual culture of healthcare; they do not provide clinical advice.'],
  [/Exact claims about first issues or technological milestones must be verified against individual images before publication\./g,'The dates and issue histories of individual items remain subjects for archival research.'],
  [/Because the dedicated total is modest, this page should gather related material through links rather than merging counts from separate categories\./g,'The dedicated office count remains separate from related corporate, communications and stationery holdings.'],
  [/Cultural sensitivity is equally important\. These subjects should not be flattened into decoration or treated as interchangeable signs of mystery\./g,'The objects also have distinct cultural, devotional and ritual contexts beyond their visual qualities.'],
  [/Captions must use accurate terminology where it can be verified\. The page should distinguish devotional, cultural and occult material rather than forcing everything into one mood\./g,'Devotional, cultural and occult material are approached through their individual contexts, with identification and terminology grounded in the surviving records.'],
  [/Detailed claims must be confirmed at image level, but the material clearly belongs to an era when mobility itself was the attraction\./g,'The catalogue wording is a starting point for research into individual devices and dates, during an era when mobility itself was the attraction.'],
  [/although individual locations must never be assumed without evidence/g,'while the locations of individual photographs remain separate questions for research'],
  [/Michael Palin's satchel/g,'a satchel associated in the catalogue with Michael Palin'],
  [/A satchel is more interesting when one knows it travelled with a familiar writer and broadcaster\./g,'A satchel associated with a familiar writer and broadcaster offers a starting point for research into the object and its journeys.'],
  [/It should receive a separate page only when the photographs and supporting catalogue evidence allow accurate identification\./g,'Its identification and context require examination of the photographs and supporting catalogue evidence.'],
  [/The accessories page provides/g,'The accessories collection provides'],
  [/Charlie Chaplin's pipe/g,'a pipe associated in the catalogue with Charlie Chaplin'],
  [/These images should be presented as cultural and design history, never as encouragement\./g,'These images are presented as cultural and design history.'],
  [/The Charlie Chaplin reference may justify an individual page after the object and its documentation are verified\. No expanded provenance should be stated from the inventory label alone\./g,'The Charlie Chaplin catalogue association requires further object-level research; the label alone does not establish personal ownership or an object history.'],
  [/Because the dedicated total is small, this page should function as an editorial junction, bringing related entertaining material together without falsely adding their counts\./g,'The dedicated collection connects to the wider entertaining material. Its count remains separate from the food, drinks, candles and tableware holdings.'],
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
  const {meta,body}=readSource(raw,filename,true);
  const sourceMetaDescription=meta.meta_description;
  const sourceMetaTitle=meta.meta_title;
  let copy=body.trim();
  if(filename.startsWith('124_'))copy=copy.replace(/For more than fifteen years he contributed regularly[^\n]+\*\*Montblanc\*\*\./,original=>{
    const replacement='The ornaments sit within a broader practice spanning magazines and commercial photography. Harper contributed regularly to **Elle** and **The Telegraph Magazine** for more than fifteen years; his other publication credits included **Vogue, Tatler, Cosmopolitan, Esquire, The Face, Wallpaper** and **Harpers & Queen**. His confirmed clients across that career included **De Beers, Boots, Heinz, Diageo, Harrods, Selfridges, the BBC, CBS Records** and **Montblanc**.';
    changes.push({file:filename,original,replacement,reason:'Retain all supplied career facts in collection-specific wording instead of repeating another page verbatim.'});
    return replacement;
  });
  const biographyVariants={
    '133_':'Harper’s brooch studies belong to a photographic career that began in Scotland. He grew up between Glasgow and Islay, received his first camera at seven and sold a concert photograph of **The Who** at fourteen. After moving to London to study photography, he spent two years at **Condé Nast** directly assisting **David Bailey, Helmut Newton and Lester Bookbinder**.',
    '113_':'Harper’s photographs of everyday mechanisms sit within a career that began in Scotland. Raised between Glasgow and Islay, he received his first camera at seven and sold a concert photograph of **The Who** at fourteen. Photography studies took him to London, followed by two years at **Condé Nast** directly assisting **David Bailey, Helmut Newton and Lester Bookbinder**.',
    '115_':'The lamp studies draw on Harper’s long photographic training. Born in Scotland and raised between Glasgow and Islay, he received a camera at seven and sold a photograph from a concert by **The Who** at fourteen. He moved to London to study photography, then spent two years at **Condé Nast** directly assisting **David Bailey, Helmut Newton and Lester Bookbinder**.'
  };
  const variant=Object.entries(biographyVariants).find(([prefix])=>filename.startsWith(prefix));
  if(variant){
    copy=copy.replace(/(?:Born in Scotland|Robert Harper was born in Scotland)[^\n]+Lester Bookbinder\*\*\./,original=>{
      changes.push({file:filename,original,replacement:variant[1],reason:'Replace a verbatim repeated biography paragraph with collection-specific wording while retaining its supplied facts.'});
      return variant[1];
    });
  }
  for(const [pattern,replacement] of edits){copy=copy.replace(pattern,match=>{changes.push({file:filename,original:match,replacement,reason:'Convert production guidance to reader-facing language or qualify an unverified assertion.'});return replacement;});}
  copy=copy.replace(/[\u2013\u2014]/g,',').replace(/\n{3,}/g,'\n\n');
  if(filename.startsWith('15_')) meta.meta_description="Explore Robert Harper's watch photography, including designer timepieces, Swatch, Mackintosh-related designs and TAG Heuer Monaco catalogue material.";
  if(filename.startsWith('46_')) meta.meta_description="Explore 151 travel-accessory photographs by Robert Harper, including maps, globes, luggage and a satchel catalogued in association with Michael Palin.";
  if(filename.startsWith('48_')) meta.meta_description="Explore 96 historical smoking photographs by Robert Harper, including pipes, lighters, cigars, cigarettes and material associated with Charlie Chaplin.";
  if(filename.startsWith('54_')) meta.meta_title='Medical Objects and Healthcare Photography | Archive.London';
  if(filename.startsWith('57_')) meta.meta_title='Optics, Binoculars and Lenses Archive | Archive.London';
  if(filename.startsWith('60_')) meta.meta_title='Umbrellas, Canes and Fans Photography Archive | Archive.London';
  if(filename.startsWith('61_')) meta.meta_title='Antiques and Historic Object Photography | Archive.London';
  if(filename.startsWith('63_')) meta.meta_title='Film Stars and Cinema Memorabilia Archive | Archive.London';
  if(filename.startsWith('72_')) meta.meta_description="Explore Robert Harper's crime and detection photography collection, containing 8 unique photographs across 30 frames.";
  if(meta.meta_title!==sourceMetaTitle)changes.push({file:filename,field:'meta_title',original:sourceMetaTitle,replacement:meta.meta_title,reason:'Keep the search title concise while preserving its subject.'});
  if(meta.meta_description!==sourceMetaDescription)changes.push({file:filename,field:'meta_description',original:sourceMetaDescription,replacement:meta.meta_description,reason:'Describe an object association without asserting unverified personal ownership.'});
  const index=Number(filename.match(/^\d+/)?.[0])-1;
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
for(const group of collectionGroups){
  const parent=pages.find(p=>p.id===group.id);
  if(!parent)continue;
  for(const child of pages.filter(p=>{const n=Number(p.sourceFile.match(/^\d+/)?.[0]);return n>=group.start&&n<=group.end;})){
    if(!parent.related.some(r=>r.path===child.path))parent.related.push({path:child.path,label:child.title});
  }
}
await fs.writeFile('content/pages.json',JSON.stringify(pages,null,2)+'\n');
const privateRegister=[];
for(const filename of (await fs.readdir('content/source')).sort()){
  const raw=await fs.readFile('content/source/'+filename,'utf8');
  privateRegister.push({sourceFile:filename,...readSource(raw,filename).meta,inventorySourceRows:[],evidenceStatus:'Supplied editorial assertions; source inventory reconciliation pending'});
}
await fs.writeFile('content/page-register.private.json',JSON.stringify(privateRegister,null,2));
await fs.mkdir('reports',{recursive:true});
await fs.writeFile('reports/editorial-changes.json',JSON.stringify(changes,null,2));
console.log(`Imported ${pages.length} supplied pages.`);
