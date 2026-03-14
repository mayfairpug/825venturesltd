(() => {
  const images = [
    { src: 'assets/images/milleniumstar-noncorrected-02x.jpg', cap: 'Jewellery & luxury still life (representative selection).' },
    { src: 'assets/images/london-curzon.jpg', cap: 'London night scene (representative selection).' },
    { src: 'assets/images/retro-tv-screens.jpg', cap: 'Technology & media imagery (representative selection).' },
    { src: 'assets/images/shopkeeper-newsagent-uk-1970s-robertharper-01.jpg', cap: 'Street portraiture (representative selection).' },
    { src: 'assets/images/t2472x1701-03163.jpg', cap: 'Documentary / incident scene (representative selection).' },
    { src: 'assets/images/christmas-focalpics-05.jpg', cap: 'Seasonal display / public installation (representative selection).' },
    { src: 'assets/images/t1760x2512-02118.jpg', cap: 'Fashion & studio portraiture (representative selection).' },
    { src: 'assets/images/t3309x2650-02342.jpg', cap: 'Automotive / studio commission (representative selection).' },
    { src: 'assets/images/t2452x1701-02201.jpg', cap: 'Editorial / staged scene (representative selection).' },
    { src: 'assets/images/gladius-aug07-focalpics-07108.jpg', cap: 'High-end marine photography (representative selection).' }
  ];

  // Footer year
  const yearNow = document.getElementById('yearNow');
  if (yearNow) yearNow.textContent = String(new Date().getFullYear());

  // Nav toggle
  const navToggle = document.querySelector('.nav__toggle');
  const nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Build thumbnails
  const thumbs = document.getElementById('thumbs');
  const leadImage = document.getElementById('leadImage');
  const leadCaption = document.getElementById('leadCaption');
  const leadFigure = document.getElementById('leadFigure');

  function setLead(idx) {
    const it = images[idx];
    if (!it || !leadImage || !leadCaption) return;
    leadImage.src = it.src;
    leadCaption.textContent = it.cap;
    document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('is-active', i === idx));
  }

  if (thumbs) {
    images.slice(0, 10).forEach((it, idx) => {
      const btn = document.createElement('button');
      btn.className = 'thumb' + (idx === 0 ? ' is-active' : '');
      btn.type = 'button';
      btn.setAttribute('aria-label', `Select image ${idx + 1}`);
      btn.innerHTML = `<img src="${it.src}" alt="" loading="lazy">`;
      btn.addEventListener('click', () => setLead(idx));
      thumbs.appendChild(btn);
    });
  }

  // Lead image opens lightbox
  if (leadFigure) {
    leadFigure.addEventListener('click', () => {
      const currentSrc = leadImage?.getAttribute('src');
      const idx = images.findIndex(x => x.src === currentSrc);
      openLightbox(idx >= 0 ? idx : 0);
    });
    leadFigure.style.cursor = 'pointer';
  }

  // Gallery grid
  const grid = document.getElementById('galleryGrid');
  if (grid) {
    images.forEach((it, idx) => {
      const d = document.createElement('div');
      d.className = 'gitem';
      d.innerHTML = `
        <img src="${it.src}" alt="" loading="lazy">
        <div class="gcap">${it.cap}</div>
      `;
      d.addEventListener('click', () => openLightbox(idx));
      grid.appendChild(d);
    });

    // Gentle, occasional shimmer across items
    const items = Array.from(grid.querySelectorAll('.gitem'));
    let shimmerIdx = 0;
    window.setInterval(() => {
      items.forEach((el) => el.classList.remove('is-glow'));
      if (items.length) {
        items[shimmerIdx % items.length].classList.add('is-glow');
        shimmerIdx++;
      }
    }, 1400);
  }

  // Lightbox
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCap = document.getElementById('lightboxCap');
  const lbClose = document.getElementById('lightboxClose');

  function openLightbox(idx) {
    const it = images[idx] || images[0];
    if (!lb || !lbImg || !lbCap) return;
    lbImg.src = it.src;
    lbImg.alt = it.cap;
    lbCap.textContent = it.cap;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lb) {
    lb.addEventListener('click', (e) => {
      if (e.target === lb) closeLightbox();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // Reveal on scroll
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.classList.add('is-in');
        io.unobserve(ent.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(el => io.observe(el));

  // Back to top button visibility
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    const toggleTop = () => {
      const show = window.scrollY > 700;
      backToTop.style.opacity = show ? '1' : '0';
      backToTop.style.pointerEvents = show ? 'auto' : 'none';
      backToTop.style.transform = show ? 'translateY(0)' : 'translateY(6px)';
      backToTop.style.transition = 'opacity .25s ease, transform .25s ease';
    };
    toggleTop();
    window.addEventListener('scroll', toggleTop, { passive: true });
  }

  // Ensure default lead is tasteful: pick a strong still-life if available
  const defaultIdx = 0;
  setLead(defaultIdx);
})();
