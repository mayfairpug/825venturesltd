import {navigation,footer} from './navigation.mjs';
// Photographs and text occupy separate document rows; motion is CSS-only.
export function homepage({hero,figures,body,header=''}) {
 const years=[1981,1987,1994,1998,2001,2003];
 return `${navigation()}<div class="homepage-scroll"><main id="main" class="home-main">
<!-- The full-bleed photograph retains its complete composition. Its caption follows below. -->
<div class="hero-photograph">${hero}</div>
<section class="home-introduction" aria-labelledby="home-title"><p class="hero-wordmark">ARCHIVE.LONDON</p><h1 id="home-title">The Robert Harper Photograph Library</h1><p class="hero-positioning">A photographic record of style, culture and modern life.</p><a class="button" href="/photography-archive/">Explore the archive</a><p class="home-intro">The home of the Robert Harper Photograph Library, an extensive private archive shaped through fashion, beauty, portraiture, advertising, travel and the exacting theatre of the studio.</p></section>
<!-- Decorative dates have their own strip, separate from every photograph. -->
<section id="years" class="year-strip" aria-label="Archive years: 1981, 1987, 1994, 1998, 2001 and 2003"><div class="year-sequence" aria-hidden="true">${years.map((year,i)=>`<span style="--delay:${i*8}s">${year}</span>`).join('')}</div></section>
<section class="home-gallery" id="gallery" aria-labelledby="gallery-title"><h2 id="gallery-title">Selected photographs</h2>
<!-- Each museum plate occupies its own full-width row, followed by its caption. -->
<div class="spotlight-gallery">${figures}</div></section>
<section class="home-reading" id="archive"><h2>About the library</h2><article class="prose" aria-label="About Archive.London">${body}</article></section>
<nav class="home-links" aria-label="Archive information"><a id="inventory" href="/photography-archive/">Photography archive</a><a id="investors" href="/professional-access/">Professional access</a></nav></main>
${footer()}</div>`;
}
