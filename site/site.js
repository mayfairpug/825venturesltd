(()=>{
 'use strict';
 const form=document.querySelector('#archive-search');
 if(form){
  fetch('/assets/page-register.json').then(r=>{if(!r.ok)throw Error('Unavailable');return r.json();}).then(records=>{
   const data=new Map(records.map(p=>[p.id,p]));
   const rows=[...document.querySelectorAll('.collection-row')];
   form.querySelector('.search-enhanced').hidden=false;
   const params=new URLSearchParams(location.search);
   for(const [key,value] of params){const field=form.elements.namedItem(key);if(field)field.value=value;}
   const normal=s=>s.toLocaleLowerCase('en-GB').normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
   function filter(updateURL=false){
    const values=Object.fromEntries(new FormData(form));let count=0;
    const words=normal(values.q||'').trim().split(/\s+/).filter(Boolean);
    for(const row of rows){const p=data.get(row.dataset.id);if(!p)continue;
     const hay=normal(p.title+' '+p.searchText);
     let show=words.every(w=>hay.includes(w));
     for(const key of ['brands','people','places','events','periods','formats','colours'])if(values[key])show=show&&p[key].includes(values[key]);
     if(values.type)show=show&&p.type===values.type;
     if(values.category)show=show&&p.title===values.category;
     if(values.availability)show=show&&p.imageAvailability===values.availability;
     if(values.letter)show=show&&p.title.startsWith(values.letter);
     row.hidden=!show;if(show)count++;
    }
    document.querySelector('#result-count').textContent=`${count} ${count===1?'collection':'collections'}`;
    document.querySelector('#no-results').hidden=count!==0;
    if(updateURL){const qs=new URLSearchParams(Object.entries(values).filter(([,v])=>v));history.replaceState(null,'',location.pathname+(qs.size?'?'+qs:''));}
   }
   form.addEventListener('submit',e=>{e.preventDefault();filter(true);});
   form.addEventListener('input',()=>filter(true));
   form.addEventListener('change',()=>filter(true));
   form.addEventListener('reset',()=>setTimeout(()=>filter(true),0));
   window.addEventListener('popstate',()=>{const qs=new URLSearchParams(location.search);for(const el of form.elements)if(el.name)el.value=qs.get(el.name)||'';filter();});
   filter();
  }).catch(()=>{const note=document.createElement('p');note.textContent='Interactive search is unavailable. Browse all collection links below or use your browser’s Find command.';form.append(note);});
 }
 const subject=new URLSearchParams(location.search).get('subject');
 const context=document.querySelector('#contact-context');
 if(context&&subject){const safe=subject.slice(0,180).replace(/[\r\n]/g,' ');context.hidden=false;document.querySelector('#enquiry-subject').textContent='Research enquiry: '+safe;document.querySelector('#email-enquiry').href='mailto:info@825ventures.online?subject='+encodeURIComponent('Archive.London enquiry: '+safe);}
 // Keep links to the previous single-page site's key sections useful after migration.
 if(location.pathname==='/'){
  const legacy={'#archive':'/robert-harper-photographer/','#inventory':'/photography-archive/','#investors':'/professional-access/','#contact':'/contact/'};
  if(legacy[location.hash])location.replace(legacy[location.hash]);
 }
})();
