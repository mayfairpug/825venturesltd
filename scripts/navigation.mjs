// Shared navigation and footer keep every archive page in the same gallery environment.
export function navigation(path='/'){
 const links=[['Home','/'],['Archive','/#gallery'],['Categories','/photography-archive/'],['Places','/photography-archive/places-travel/'],['People','/photography-archive/portraits/'],['Years','/#years'],['About','/robert-harper-photographer/']];
 return `<header class="home-navigation"><a class="home-logo" href="/">ARCHIVE.LONDON</a><nav aria-label="Primary">${links.map(([label,url])=>`<a href="${url}"${path===url?' aria-current="page"':''}>${label}</a>`).join('')}</nav></header>`;
}
export function footer(){return `<footer id="contact" class="home-footer"><div><p>Archive.London</p><p class="ownership">Owned by 825 Ventures Ltd.</p><a href="/rights-and-stewardship/">Rights and stewardship</a></div><a href="mailto:info@825ventures.online">info@825ventures.online</a><a href="https://wa.me/447410292347">WhatsApp +44 7410 292347</a></footer>`;}
