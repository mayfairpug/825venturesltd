# Archive.London

Static editorial website for the Robert Harper Photograph Library. The new site is generated into `dist/`. The original root-level site and original JPEG files remain intact until the domain migration is ready.

## Build and review

Requires Node.js 22 or later.

```sh
npm ci
npm run build
npm run check
npm run preview
```

The preview is at `http://127.0.0.1:4173`. It sends `X-Robots-Tag: noindex, nofollow` to keep development previews out of search engines. Publish only `dist/`, never the repository or `content/` directory. The production build uses `https://archive.london` canonicals and a matching sitemap.

For browser checks, install Google Chrome or change the Playwright launch channel in `scripts/browser-check.mjs` to a locally available browser, then run `npm run test:browser` while the preview server is running.

## Content

`content/pages.json` is the editable source of page copy, page-specific metadata, supplied numeric catalogue facts and related links. The build derives the public register, archive directory, metadata, schema, links and sitemap from that source. Three supporting pages are maintained in the build script: professional access, contact, and rights and stewardship.

The owner-supplied Markdown files are retained locally in the ignored `content/source/` folder. `scripts/import-content.mjs` converts their front matter and separates production guidance from public copy. Re-importing replaces `content/pages.json`; make editorial changes in the import rules or merge them deliberately. The import report records every editorial transformation. The full source evidence register remains outside the deployable output.

Current content includes files 01 through 39 and 41 through 229, plus 240 through 249. File 40 and Batch 25 (230 through 239) were not supplied. Collection-level figures originate in supplied editorial copy and have not been independently reconciled against an inventory spreadsheet. Related holdings may overlap. The public register records `verifiedImageCount: null` until source reconciliation is complete. Broad subject collections are not marked as individual historical events. ZIP-batch README notes remain production context and are not published as page copy.

The importer supports YAML front matter and labelled Markdown metadata, including comma-formatted counts, published page groups and both frame-count labels used in the source files. Suggested `/archive/` routes in Batches 10 through 24 are mapped into the existing `/photography-archive/` structure, including links to earlier collections. Supplied image-treatment instructions, sample JSON-LD and physical storage locations stay in private source files; the build generates schema consistently from public page data. The garden and botanical parent collection links to its ten detailed collections; hair and grooming links to its twelve detailed collections. Interiors and design links to thirty detailed household collections. The two supplied domestic-lighting collections retain separate routes and counts. Each child links back to the appropriate parent without duplicate related links. Source numbers may contain three or more digits. Jewellery links to twenty detailed collections. Kitchen and tableware links to twenty detailed collections. The three necklace groups remain separate; the pearl collection preserves the royal catalogue reference without asserting ownership. The De Beers page uses the existing /photography-archive/jewellery/de-beers-diamonds/ destination, resolving earlier jewellery links.

Original supplied metadata is used where present. Missing social titles and descriptions use that page's unique title and description. Missing source-linked pages are recorded in `reports/link-resolutions.json`; they are not created as thin pages. In-body links become subject-specific research enquiries. Related-collection lists contain real collection routes only.

## Photography

Final category image allocation is deferred until the owner supplies the photographs. `content/image-assignments.json` controls page-specific images. Currently only the existing homepage photograph is assigned. The ten existing photographs remain in the homepage gallery, with responsive JPEG/WebP derivatives and descriptive alt text. Original JPEGs are preserved. No stock, generated or unrelated category imagery is used.

Source images are resized without enlargement or cropping. ImageObject entries are emitted only for photographs actually displayed on that page. Unillustrated pages have no inherited, unrelated social image.

## Validation and limits

`npm run check` checks routes, local links and fragments, headings, image dimensions and alternatives, metadata uniqueness, canonicals, sitemap coverage, schema references, source-page coverage, placeholders and five-word editorial similarity. Schema checks validate local syntax, expected types, graph references and visible-content agreement; they are not an external rich-results certification.

Browser checks cover every page at desktop size with axe-core WCAG A/AA rules, every page at 320px and 390px for overflow, archive search/filter/reset behaviour, URL restoration, no-JavaScript navigation, contact prefill, the 404 response, the keyboard skip link and reduced motion. Local timing observations are not field Core Web Vitals. Automated accessibility checks do not establish complete WCAG conformance.

## Domain migration, pending launch

1. Configure the existing hosting provider to build with `npm ci && npm run build` and publish `dist/`.
2. Confirm DNS, HTTPS and the preferred `archive.london` hostname.
3. Configure permanent server-side redirects from both old-domain hostnames to the corresponding new-domain paths. Preserve paths and query strings. This repository does not establish which hosting provider currently handles redirects.
4. Verify the custom 404 is returned with HTTP 404, and slashless page URLs redirect to the trailing-slash canonical rather than creating duplicate routes.
5. Confirm the contact mailbox. The existing working address is retained; no new mailbox is assumed.
6. Review final photographs and unresolved catalogue facts, then run checks against the deployed site and submit the sitemap through the appropriate search-console account.

Legacy homepage anchors for archive, inventory, investors and contact use native anchors and links. This is separate from the required server-side domain migration.

Batch 19 adds ten landscape, documentary, publishing and object collections. Named location references remain catalogue associations rather than asserted commissions. New collections link to relevant parent collections; the two landscape groups retain separate routes and supplied counts.

Batch 20 adds models and catwalk fashion, financial objects, three music-object collections and five artist collections. The Clapton collection uses the previously linked music route, and Bowie source aliases resolve to one canonical page. Unique shots and total frames remain distinct, including the two studies across fourteen frames for Everything But The Girl.

Batch 21 adds ten music collections and brings the musician parent’s detailed collections to fifteen. London Zoo and Michael Collins retain their catalogue names without inferred identities. Shanana retains the supplied spelling. The recorded months for Jethro Tull and Stan Webb Band remain in the page copy.

Batch 22 adds four performer collections, newspaper, office, optics and party studies, and Calvin Klein and Chanel fragrance collections. Nineteen detailed music collections link to their parent. Virginia McNaughton’s recorded spelling variant remains within one page; mixed-performer totals are not allocated to individuals. Fragrance product subjects do not imply brand commissions. The mixed-performer collection also links reciprocally to portraits.

Batch 23 adds nine fragrance-house collections and fragrance group studies, bringing the fragrance parent to twelve detailed collections. Source brand spelling is retained in catalogue notes; product subjects do not establish direct commissions. Group-study counts remain separate from individual house holdings.

Batch 24 adds ten fragrance collections, including men’s fragrance and full-frame studies. Twenty-two detailed fragrance collections link to their parent without summing potentially overlapping holdings.

## Design system

The site uses ivory and warm neutrals, charcoal body text, and restrained heritage-green navigation, headings and hover accents. Cormorant Garamond and Inter are self-hosted under their included open-source licences. Regular and medium weights, positive headline tracking, quiet controls and spacious asymmetrical photography layouts establish the editorial style. Collection pages awaiting imagery use text-only headings without decorative initials. Gold is limited to the wordmark dot and favicon detail. Future UI should follow these same tokens and patterns.

Batch 26 adds Scotland, Tuscany, six portrait collections, prehistoric studies and ritual objects. Katori spelling variants remain explicit and cross-linked without assuming an identity match.

The homepage opens with the Curzon photograph, followed by its caption and a separate green year strip. All photographs are centred, uncropped and capped at 90vh, one per row, with eight-rem desktop spacing. All narrative is visible. The homepage uses no executable JavaScript; CSS provides decorative year fades and reduced-motion support. A fixed ivory menu remains visible above a separate scrolling gallery. The footer contains identity, ownership and contact details.

Batches 27–30 add forty object and footwear collections. The build now includes 278 supplied pages and 281 routes. Batch 25 (230–239) and file 40 remain absent. Source counts are not independently verified.

SEO output includes unique titles, descriptions and keywords, canonical URLs, structured data, and page, image and category sitemaps with content-change dates. CSS and JavaScript are minified; Brotli and gzip copies are generated. The generated _headers file requires compatible hosting; compressed copies require server support. Production response times and indexing are not guaranteed by a local build.
The fixed ivory navigation, reserved scrolling area, typography, green accents, minimal footer and viewport-fitted imagery now apply to all collection, biography, contact and access pages. Search filters and page contents remain expanded. Batch 30 brings the total to 278 supplied pages, 281 routes and 275 collections. Automated editorial comparison flags two pairs of closely related footwear descriptions for later editorial consideration; no long paragraph is repeated verbatim.

Batch 31 adds six footwear collections, field sport, silver, smoking objects and ball games. Current coverage is 288 supplied pages, 291 routes and 285 collections. Catalogue associations remain distinct from confirmed object ownership.
Batch 32 adds five sporting collections and five stationery collections. Current coverage is 298 supplied pages, 301 routes and 295 collections. The latest mobile layout allows long headings to wrap within shrinking grid tracks. The editorial similarity report identifies six pairs for human review, with no repeated long paragraphs.

Batch 33 adds historic London streets, communication devices, torches and seven toy/game collections. Current coverage: 308 supplied files, 311 routes and 305 collections. Catalogue dates and spellings are retained without extending unverified identifications.

Batch 34 adds four toy collections, transport, travel objects, television equipment, umbrellas, love tokens and designer watches. Coverage is now 318 supplied files, 321 routes and 315 collections. Object associations remain catalogue leads; the watch count’s source asterisk is retained in the provenance copy.
