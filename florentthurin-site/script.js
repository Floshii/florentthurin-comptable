/* ============================================
   FLORENTTHURIN.COM — SCRIPT
   ============================================ */

// === TRADUCTIONS ===
const translations = {
  fr: {
    cta:            'Prendre rendez-vous',
    heroLine1:      'Je construis les systèmes B2B',
    heroLine2:      'qui rendent le sourire à vos commerciaux.',
    heroSubtitle:   "Depuis 10 ans, j'aide les dirigeants à arrêter de bricoler leur acquisition.",
    stat1:          "années d'opérations",
    stat2:          'clients accompagnés',
    stat3Number:    '6 chiffres',
    stat3:          'de contrats signés',
    stat4:          'échecs entrepreneuriaux <em>(assumés)</em> 🏆',
    stat4Tooltip:   'Dont 3 dont je suis encore fier.',
    testimonialsTitle: "Ce que disent les gens avec qui j'ai bossé",
    t1text:   '"Florent nous a aidés à structurer notre approche commerciale en quelques semaines. Les résultats ont été immédiats."',
    t1author: '— Olivier Rovellotti',
    t1role:   'CEO, Natural Solution',
    t2text:   '"Ce qui m\'a frappé, c\'est la clarté du système proposé. On est passé du flou total à une pipeline solide."',
    t2author: '— Ronan Jaffré',
    t2role:   'Co-founder, Fullbound Lab',
    t3text:   '"Pas de bullshit, que de la méthode. Florent dit ce qui marche et ce qui ne marche pas."',
    t3author: '— Arthur Anouil',
    t3role:   'Fondateur, WAAI agence IA',
    contentTitle:   'Je publie ce que j\'apprends',
    badgeNew:       'Nouveau',
    ctaTitle:       'Ton acquisition B2B mérite un système.',
    footerPunchline:'Fait à la main en Gironde, entre deux échecs.',
    footerContact:  'Contact',
    footerLegal:    'Mentions légales',
    metaDesc:       "Florent Thurin construit des systèmes B2B qui remplissent des agendas commerciaux. 10 ans d'expérience, 50+ clients accompagnés.",
  },
  en: {
    cta:            'Book a call',
    heroLine1:      'I build the B2B systems',
    heroLine2:      'that put a smile back on your sales team.',
    heroSubtitle:   "For 10 years, I've helped founders stop patching their acquisition together.",
    stat1:          'years in the trenches',
    stat2:          'clients worked with',
    stat3Number:    '6-figure',
    stat3:          'in signed contracts',
    stat4:          'failed ventures <em>(and counting)</em> 🏆',
    stat4Tooltip:   "Including 3 I'm still proud of.",
    testimonialsTitle: "What the people I've worked with have to say",
    t1text:   '"Florent helped us structure our commercial approach in a matter of weeks. Results were immediate."',
    t1author: '— Olivier Rovellotti',
    t1role:   'CEO, Natural Solution',
    t2text:   '"What struck me was the clarity of the system he proposed. We went from total fog to a solid pipeline."',
    t2author: '— Ronan Jaffré',
    t2role:   'Co-founder, Fullbound Lab',
    t3text:   '"No bullshit, just method. Florent tells you what works and what doesn\'t."',
    t3author: '— Arthur Anouil',
    t3role:   'Founder, WAAI AI Agency',
    contentTitle:   'I publish what I learn',
    badgeNew:       'New',
    ctaTitle:       'Your B2B acquisition deserves a system.',
    footerPunchline:'Handcrafted in Gironde, between two failures.',
    footerContact:  'Contact',
    footerLegal:    'Legal notice',
    metaDesc:       'Florent Thurin builds B2B systems that fill sales calendars. 10+ years of experience, 50+ clients.',
  },
};

// === LANGUE ===
let currentLang = localStorage.getItem('lang') || 'fr';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;

  const t = translations[lang];

  // Mettre à jour tous les éléments [data-i18n]
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  // Bouton switch
  const btn = document.getElementById('lang-switch');
  if (btn) {
    btn.textContent = lang === 'fr' ? 'EN' : 'FR';
    btn.setAttribute('aria-label', lang === 'fr' ? 'Switch to English' : 'Passer en français');
  }

  // Meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = t.metaDesc;

  // og:locale
  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) ogLocale.content = lang === 'fr' ? 'fr_FR' : 'en_US';
}

// === ANIMATION HERO ===
function initHeroAnimation() {
  // Petit délai pour que le navigateur soit prêt
  requestAnimationFrame(() => {
    setTimeout(() => {
      const hero = document.getElementById('hero');
      if (hero) hero.classList.add('hero-animate');
    }, 60);
  });
}

// === COMPTEUR STATS ===
function animateCounter(el, target, suffix, duration = 1200) {
  const start = performance.now();
  const step = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Easing out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initStatsObserver() {
  const statsSection = document.getElementById('stats');
  if (!statsSection || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.stat-number[data-target]').forEach(el => {
          animateCounter(
            el,
            parseInt(el.dataset.target, 10),
            el.dataset.suffix || '',
          );
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  observer.observe(statsSection);
}

// === FADE-IN AU SCROLL ===
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;

  const selectors = [
    '.testimonial-card',
    '.platform-card',
    '.section-title',
    '.cta-final-title',
    '.video-facade-wrap',
  ];
  const targets = document.querySelectorAll(selectors.join(', '));

  targets.forEach(el => el.classList.add('fade-in-up'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger subtil entre cartes adjacentes
        const siblings = entry.target.parentElement
          ? Array.from(entry.target.parentElement.children).filter(c => c.classList.contains('fade-in-up'))
          : [];
        const idx = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, Math.min(idx * 80, 240));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  targets.forEach(el => observer.observe(el));
}

// === VIDÉO YOUTUBE (facade → iframe au clic) ===
function initVideoFacade() {
  const facade = document.getElementById('video-facade');
  if (!facade) return;

  const load = () => {
    const videoId = facade.dataset.videoId;
    if (!videoId || videoId === 'YOUTUBE_VIDEO_ID_HERE') return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.title = 'Vidéo YouTube — Florent Thurin';
    facade.innerHTML = '';
    facade.appendChild(iframe);
  };

  facade.addEventListener('click', load);
  facade.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); load(); }
  });
}

// === STICKY CTA MOBILE ===
function initStickyCTA() {
  if (!('IntersectionObserver' in window)) return;

  const heroCta = document.querySelector('.hero-cta');
  const sticky  = document.getElementById('sticky-cta');
  if (!heroCta || !sticky) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const hidden = !entry.isIntersecting;
      sticky.style.display = hidden ? 'block' : 'none';
      sticky.setAttribute('aria-hidden', String(!hidden));
    });
  }, { threshold: 0.1 });

  observer.observe(heroCta);
}

// === HEADER SCROLL SHADOW ===
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const toggle = () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  };

  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
}

// === ANNÉE FOOTER ===
function setCurrentYear() {
  const el = document.getElementById('current-year');
  if (el) el.textContent = new Date().getFullYear();
}

// === EASTER EGG CONSOLE ===
function consoleEasterEgg() {
  const orange = 'color:#FF6B1A;font-weight:bold;font-size:13px;line-height:1.5';
  const grey   = 'color:#525252;font-size:13px';
  console.log(
    '%c' +
    '███████╗██╗      ██████╗ ██████╗ ███████╗███╗   ██╗████████╗\n' +
    '██╔════╝██║     ██╔═══██╗██╔══██╗██╔════╝████╗  ██║╚══██╔══╝\n' +
    '█████╗  ██║     ██║   ██║██████╔╝█████╗  ██╔██╗ ██║   ██║   \n' +
    '██╔══╝  ██║     ██║   ██║██╔══██╗██╔══╝  ██║╚██╗██║   ██║   \n' +
    '██║     ███████╗╚██████╔╝██║  ██║███████╗██║ ╚████║   ██║   \n' +
    '╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝  \n\n' +
    '████████╗██╗  ██╗██╗   ██╗██████╗ ██╗███╗   ██╗\n' +
    '╚══██╔══╝██║  ██║██║   ██║██╔══██╗██║████╗  ██║\n' +
    '   ██║   ███████║██║   ██║██████╔╝██║██╔██╗ ██║\n' +
    '   ██║   ██╔══██║██║   ██║██╔══██╗██║██║╚██╗██║\n' +
    '   ██║   ██║  ██║╚██████╔╝██║  ██║██║██║ ╚████║\n' +
    '   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝',
    orange,
  );
  console.log(
    '%cHey. Tu fouilles dans la console ?\nC\'est exactement ce que je ferais.\n\nEnvoie-moi un DM → linkedin.com/in/florentthurin/',
    grey,
  );
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  setLang(currentLang);

  const langBtn = document.getElementById('lang-switch');
  if (langBtn) {
    langBtn.addEventListener('click', () => setLang(currentLang === 'fr' ? 'en' : 'fr'));
  }

  initHeroAnimation();
  initStatsObserver();
  initScrollAnimations();
  initVideoFacade();
  initStickyCTA();
  initHeaderScroll();
  setCurrentYear();
  consoleEasterEgg();
});
