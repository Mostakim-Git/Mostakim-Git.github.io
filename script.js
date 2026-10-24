// ─── 0. KINETIC PRELOADER ───────────────────────────────────────────────────
(() => {
  const LOADER_REVEAL_DELAY = 550;
  const LOADER_HARD_TIMEOUT = 2500;

  let dismissed = false;
  const dismissLoader = () => {
    if (dismissed) return;
    dismissed = true;
    const loader = document.getElementById('kinetic-loader-wrapper');
    if (loader) loader.classList.add('loaded');
  };

  const scheduleDismiss = () => setTimeout(dismissLoader, LOADER_REVEAL_DELAY);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleDismiss, { once: true });
  } else {
    scheduleDismiss();
  }
  setTimeout(dismissLoader, LOADER_HARD_TIMEOUT);
})();

// ─── 1. LENIS SMOOTH SCROLL + GSAP SCROLLTRIGGER ────────────────────────────
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.registerPlugin(ScrollTrigger);

let lenis = null;
if (typeof Lenis !== 'undefined' && !reduceMotion) {
  lenis = new Lenis({
    duration: 1.35,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

function smoothScrollTo(target, offset = -40, duration = 1.4, onComplete) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, {
      duration,
      offset,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      onComplete,
    });
  } else {
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    if (typeof onComplete === 'function') setTimeout(onComplete, 400);
  }
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId && targetId.length > 1) {
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        smoothScrollTo(targetEl, -36, 1.4);
      }
    }
  });
});

// ─── 2. MOBILE OVERLAY MENU ─────────────────────────────────────────────────
const menuTrigger = document.querySelector('.menu-trigger');
const menuOverlay = document.querySelector('.menu-overlay');
const menuLinks = document.querySelectorAll('.menu-links a');
let menuOpen = false;

function toggleMenu() {
  if (!menuOverlay || !menuTrigger) return;
  if (!menuOpen) {
    menuOverlay.classList.add('is-open');
    menuOverlay.setAttribute('aria-hidden', 'false');
    menuTrigger.setAttribute('aria-expanded', 'true');
    menuTrigger.textContent = 'Close';
    gsap.to(menuOverlay, { clipPath: 'inset(0 0 0% 0)', duration: 0.75, ease: 'power4.inOut' });
    gsap.to(menuLinks, { y: 0, opacity: 1, stagger: 0.05, duration: 0.55, ease: 'power3.out', delay: 0.25 });
  } else {
    menuTrigger.setAttribute('aria-expanded', 'false');
    menuTrigger.textContent = 'Menu';
    gsap.to(menuLinks, { y: 20, opacity: 0, stagger: 0.04, duration: 0.35, ease: 'power3.in' });
    gsap.to(menuOverlay, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.75,
      ease: 'power4.inOut',
      delay: 0.15,
      onComplete: () => {
        menuOverlay.classList.remove('is-open');
        menuOverlay.setAttribute('aria-hidden', 'true');
      },
    });
  }
  menuOpen = !menuOpen;
}

if (menuTrigger) {
  menuTrigger.addEventListener('click', toggleMenu);
  menuLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (menuOpen) toggleMenu();
    });
  });
}

// ─── 3. HEADER SCROLL STATE & SPOTLIGHT NAVBAR ──────────────────────────────
const header = document.getElementById('site-header');
if (header) {
  ScrollTrigger.create({
    start: 'top -50',
    onUpdate: (self) => {
      header.classList.toggle('scrolled', self.progress > 0);
    },
  });
}

const spotlightNav = document.querySelector('.spotlight-nav');
if (spotlightNav) {
  const navItems = spotlightNav.querySelectorAll('.nav-item');
  let activeIdx = 0;
  let navRect = null;

  function getNavRect() {
    navRect = spotlightNav.getBoundingClientRect();
  }

  function updateAmbience(index) {
    if (!navItems[index]) return;
    activeIdx = index;
    navItems.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    getNavRect();
    if (navRect.width > 0) {
      const itemRect = navItems[index].getBoundingClientRect();
      const targetX = itemRect.left - navRect.left + itemRect.width / 2;
      spotlightNav.style.setProperty('--ambience-x', `${targetX}px`);
    }
  }

  spotlightNav.addEventListener('mousemove', (e) => {
    if (!navRect) getNavRect();
    const x = e.clientX - navRect.left;
    spotlightNav.style.setProperty('--spotlight-x', `${x}px`);
  });

  spotlightNav.addEventListener('mouseleave', () => {
    const activeItem = navItems[activeIdx];
    if (activeItem && navRect) {
      const itemRect = activeItem.getBoundingClientRect();
      const targetX = itemRect.left - navRect.left + itemRect.width / 2;
      spotlightNav.style.setProperty('--spotlight-x', `${targetX}px`);
    }
  });

  navItems.forEach((item, idx) => {
    item.addEventListener('click', () => updateAmbience(idx));
  });

  window.addEventListener('load', () => {
    getNavRect();
    updateAmbience(0);
  });

  window.addEventListener(
    'resize',
    () => {
      getNavRect();
      updateAmbience(activeIdx);
    },
    { passive: true }
  );

  const sectionIds = ['#hero', '#philosophy-group', '#documentary', '#skills', '#showcase', '#footer'];
  sectionIds.forEach((secId, i) => {
    const el = document.querySelector(secId);
    if (el) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 45%',
        end: 'bottom 45%',
        onEnter: () => updateAmbience(i),
        onEnterBack: () => updateAmbience(i),
      });
    }
  });
}

// ─── 4. LIQUID-GLASS BUTTON CURSOR RADIAL TRACKING ──────────────────────────
document.querySelectorAll('.project-link, .action-btn').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--lx', `${x.toFixed(1)}%`);
    btn.style.setProperty('--ly', `${y.toFixed(1)}%`);
  });
});

// ─── 5. DOCUMENTARY CINEMA PLAYER ───────────────────────────────────────────
const cinemaStage = document.getElementById('cinemaStage');
const playDocBtn = document.getElementById('playDocBtn');

function mountDocumentaryPlayer() {
  if (!cinemaStage || cinemaStage.dataset.playing === 'true') return;
  const videoId = cinemaStage.getAttribute('data-video-id') || '-eOgfXAkdDY';
  cinemaStage.dataset.playing = 'true';

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  iframe.title = 'The Presence of Mughal Influence in Old Dhaka | Documentary by Mostakim Billah';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allowFullscreen = true;

  cinemaStage.innerHTML = '';
  cinemaStage.appendChild(iframe);
}

if (playDocBtn) {
  playDocBtn.addEventListener('click', mountDocumentaryPlayer);
}

document.querySelectorAll('.watch-inline-trigger').forEach((trigger) => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    smoothScrollTo('#documentary', -24, 1.3, () => {
      mountDocumentaryPlayer();
    });
  });
});

// ─── 6. HERO ANIMATION & PARALLAX BACKGROUNDS ───────────────────────────────
function initFlipFadeText() {
  const headline = document.querySelector('.hero-headline');
  if (!headline) return;

  gsap.set(headline, { perspective: 1000 });
  const htmlContent = headline.innerHTML;
  headline.innerHTML = '';

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  tempDiv.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      const words = node.textContent.split(' ');
      words.forEach((word, wordIdx) => {
        if (word.length === 0) return;
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'pre';

        word.split('').forEach((char) => {
          const charSpan = document.createElement('span');
          charSpan.textContent = char;
          charSpan.style.display = 'inline-block';
          charSpan.className = 'flip-fade-char';
          gsap.set(charSpan, { rotateX: -85, y: 22, autoAlpha: 0 });
          wordSpan.appendChild(charSpan);
        });

        headline.appendChild(wordSpan);
        if (wordIdx < words.length - 1) {
          headline.appendChild(document.createTextNode(' '));
        }
      });
    } else {
      headline.appendChild(node.cloneNode(true));
    }
  });

  gsap.to('.flip-fade-char', {
    rotateX: 0,
    y: 0,
    autoAlpha: 1,
    duration: 0.85,
    stagger: 0.03,
    ease: 'power3.out',
    delay: 0.2,
  });
}

if (!reduceMotion) {
  gsap.from('.hero-bg-media', { scale: 1.14, duration: 1.8, ease: 'power2.out' });
  gsap.from('.hero-eyebrow, .hero-subline, .hero-cta-row', {
    y: 24,
    opacity: 0,
    stagger: 0.14,
    duration: 0.9,
    ease: 'power3.out',
    delay: 0.35,
  });
  gsap.to('.scroll-indicator', { y: 8, repeat: -1, yoyo: true, duration: 1.4, ease: 'sine.inOut' });

  // Smooth GPU parallax on background layers
  gsap.utils.toArray('.hero-bg-media, .showcase-bg, .footer-bg-media').forEach((bg) => {
    gsap.fromTo(
      bg,
      { yPercent: -8 },
      {
        yPercent: 8,
        force3D: true,
        ease: 'none',
        scrollTrigger: {
          trigger: bg.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });

  // Philosophy entrance animations
  if (document.querySelector('.bio-portrait-col')) {
    gsap.from('.bio-portrait-col', {
      scrollTrigger: { trigger: '#manifesto', start: 'top 75%' },
      x: -60,
      opacity: 0,
      duration: 1.05,
      ease: 'power3.out',
    });

    gsap.from('.bio-tagline, .bio-body p', {
      scrollTrigger: { trigger: '#manifesto', start: 'top 70%' },
      y: 36,
      opacity: 0,
      stagger: 0.15,
      duration: 0.85,
      ease: 'power3.out',
      delay: 0.15,
    });
  }

  // Documentary section entrance
  gsap.from('.cinema-stage, .linkedin-dispatch-card', {
    scrollTrigger: { trigger: '#documentary', start: 'top 75%' },
    y: 45,
    opacity: 0,
    stagger: 0.16,
    duration: 0.95,
    ease: 'power3.out',
  });

  // Disciplines entrance
  const skillItems = document.querySelectorAll('.skills-list li');
  if (skillItems.length) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      gsap.from(skillItems, {
        scrollTrigger: { trigger: '#skills', start: 'top 85%', once: true },
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });
    } else {
      gsap.from(skillItems, {
        scrollTrigger: { trigger: '#skills', start: 'top 72%' },
        y: 55,
        opacity: 0,
        clipPath: 'inset(0 0 100% 0)',
        stagger: 0.12,
        duration: 0.85,
        ease: 'power4.out',
        clearProps: 'clipPath,transform',
      });
    }
  }

  // Selected Work label entrance
  gsap.from('#showcase .section-label', {
    scrollTrigger: { trigger: '#showcase', start: 'top 82%' },
    x: -100,
    opacity: 0,
    duration: 1.15,
    ease: 'expo.out',
  });

  // Subtle parallax drift on section watermarks
  document.querySelectorAll('.section-label').forEach((label) => {
    const parent = label.closest('section');
    if (!parent || window.matchMedia('(max-width: 768px)').matches) return;
    gsap.to(label, {
      scrollTrigger: {
        trigger: parent,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
      y: -36,
      ease: 'none',
    });
  });

  window.addEventListener('load', initFlipFadeText);
}

// ─── 7. SCOPED ACCORDIONS (ACADEMICS & EXPERIENCE) ──────────────────────────
document.querySelectorAll('.academic-section-wrapper').forEach((group) => {
  const btns = group.querySelectorAll('.academic-row');
  const panels = group.querySelectorAll('.academic-panel');

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;

      btns.forEach((b) => {
        if (b !== btn) b.setAttribute('aria-expanded', 'false');
      });
      panels.forEach((p) => {
        if (p !== panel) p.classList.remove('is-open');
      });

      btn.setAttribute('aria-expanded', String(!expanded));
      panel.classList.toggle('is-open', !expanded);

      panel.addEventListener(
        'transitionend',
        () => {
          requestAnimationFrame(() => {
            ScrollTrigger.refresh();
          });
        },
        { once: true }
      );
    });
  });
});

// ─── 8. SELECTED WORK: SCROLL-PINNED VISUAL PANEL ───────────────────────────
let showcasePairs = [];
let pinTrigger = null;
let itemTriggers = [];

function activateVisual(index) {
  document.querySelectorAll('.showcase-item.active').forEach((item) => item.classList.remove('active'));
  document.querySelectorAll('.visual-frame img.active').forEach((img) => img.classList.remove('active'));

  const active = showcasePairs[index];
  if (!active) return;
  active.item.classList.add('active');
  if (active.visual) active.visual.classList.add('active');
}

function initShowcaseScroll(initialIndex) {
  if (pinTrigger) {
    pinTrigger.kill();
    pinTrigger = null;
  }
  itemTriggers.forEach((t) => t.kill());
  itemTriggers = [];

  const isDesktop = window.matchMedia('(min-width: 1025px)').matches;
  const allItems = gsap.utils.toArray('.showcase-item');
  const allVisuals = gsap.utils.toArray('.visual-frame img');

  showcasePairs = allItems
    .map((item, i) => ({ item, visual: allVisuals[i] || null }))
    .filter(({ item }) => getComputedStyle(item).display !== 'none');

  if (!isDesktop) return;

  pinTrigger = ScrollTrigger.create({
    trigger: '.showcase-container',
    start: 'top top',
    end: 'bottom bottom',
    pin: '.showcase-visuals',
  });

  showcasePairs.forEach(({ item }, i) => {
    itemTriggers.push(
      ScrollTrigger.create({
        trigger: item,
        start: 'top 52%',
        end: 'bottom 48%',
        onEnter: () => activateVisual(i),
        onEnterBack: () => activateVisual(i),
      })
    );
  });

  let startIdx = 0;
  if (initialIndex != null && initialIndex < showcasePairs.length) {
    startIdx = initialIndex;
  } else {
    const midY = window.innerHeight * 0.5;
    let minDiff = Infinity;
    showcasePairs.forEach(({ item }, i) => {
      const rect = item.getBoundingClientRect();
      const diff = Math.abs(rect.top + rect.height * 0.5 - midY);
      if (diff < minDiff) {
        minDiff = diff;
        startIdx = i;
      }
    });
  }
  if (showcasePairs.length > 0) activateVisual(startIdx);
}

initShowcaseScroll();

let resizeTimer = null;
window.addEventListener(
  'resize',
  () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initShowcaseScroll();
      ScrollTrigger.refresh();
    }, 180);
  },
  { passive: true }
);

// ─── 9. SEE MORE / SHOW LESS PROJECTS ───────────────────────────────────────
const seeMoreBtn = document.getElementById('seeMoreBtn');
const showLessBtn = document.getElementById('showLessBtn');
const extraProjects = document.querySelectorAll('.extra-project');

function expandExtraProjects(onExpanded) {
  let anyHidden = false;
  extraProjects.forEach((proj) => {
    if (getComputedStyle(proj).display === 'none') {
      anyHidden = true;
      proj.style.display = 'block';
      gsap.set(proj, { opacity: 0, y: 40 });
    }
  });

  if (!anyHidden) {
    if (typeof onExpanded === 'function') onExpanded();
    return;
  }

  if (seeMoreBtn) seeMoreBtn.style.display = 'none';
  if (showLessBtn) {
    showLessBtn.style.display = 'inline-block';
    showLessBtn.setAttribute('aria-expanded', 'true');
  }

  requestAnimationFrame(() => {
    initShowcaseScroll();
    ScrollTrigger.refresh();
    gsap.to(extraProjects, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
    });
    if (typeof onExpanded === 'function') onExpanded();
  });
}

if (seeMoreBtn && showLessBtn) {
  seeMoreBtn.addEventListener('click', () => {
    expandExtraProjects(() => {
      const firstExtra = extraProjects[0];
      if (firstExtra) smoothScrollTo(firstExtra, -110, 1.3);
    });
  });

  showLessBtn.addEventListener('click', () => {
    if (showLessBtn.dataset.collapsing === 'true') return;
    showLessBtn.dataset.collapsing = 'true';

    const visibleProjects = document.querySelectorAll('.showcase-item:not(.extra-project)');
    const lastVisible = visibleProjects[visibleProjects.length - 1] || visibleProjects[0];
    const lastVisibleIdx = visibleProjects.length - 1;

    gsap.to(extraProjects, {
      opacity: 0,
      y: 28,
      duration: 0.32,
      stagger: 0.05,
      ease: 'power2.in',
    });

    let collapsed = false;
    const doCollapse = () => {
      if (collapsed) return;
      collapsed = true;
      extraProjects.forEach((proj) => {
        proj.style.display = 'none';
        gsap.set(proj, { clearProps: 'transform,opacity' });
      });
      showLessBtn.style.display = 'none';
      showLessBtn.dataset.collapsing = '';
      seeMoreBtn.style.display = 'inline-flex';
      seeMoreBtn.setAttribute('aria-expanded', 'false');
      initShowcaseScroll(lastVisibleIdx);
      ScrollTrigger.refresh();
    };

    if (lastVisible) {
      smoothScrollTo(lastVisible, -100, 1.0, doCollapse);
      setTimeout(doCollapse, 1150);
    } else {
      doCollapse();
    }
  });
}

// ─── 10. DISCIPLINES ROW NAVIGATION (AUTO-EXPANDS EXTRA PROJECTS IF NEEDED) ─
document.querySelectorAll('.skill-row[data-href]').forEach((row) => {
  const navigate = () => {
    const targetId = row.getAttribute('data-href');
    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    if (targetEl.classList.contains('extra-project') && getComputedStyle(targetEl).display === 'none') {
      expandExtraProjects(() => {
        smoothScrollTo(targetEl, -90, 1.3);
      });
    } else {
      smoothScrollTo(targetEl, -90, 1.3);
    }
  };

  row.addEventListener('click', navigate);
  row.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate();
    }
  });
});

// ─── 11. MORPH TEXT OBSERVER & COPY EMAIL & BACK TO TOP ─────────────────────
const morphWords = document.querySelectorAll('.morph-word');
const footerCenter = document.querySelector('.footer-center');
if (morphWords.length > 0 && footerCenter) {
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      morphWords.forEach((word) => word.classList.toggle('active', entry.isIntersecting));
    });
  }).observe(footerCenter);
}

const copyEmailBtn = document.getElementById('copyEmailBtn');
const copyHint = document.getElementById('copyHint');
if (copyEmailBtn && copyHint) {
  copyEmailBtn.addEventListener('click', async () => {
    const email = copyEmailBtn.getAttribute('data-email') || 'to.mostakim@gmail.com';
    try {
      await navigator.clipboard.writeText(email);
      copyHint.textContent = 'Copied ✓';
      setTimeout(() => {
        copyHint.textContent = 'Copy ⎘';
      }, 2200);
    } catch (_) {
      window.location.href = `mailto:${email}`;
    }
  });
}

const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener(
    'scroll',
    () => {
      backToTop.classList.toggle('visible', window.scrollY > window.innerHeight * 0.85);
    },
    { passive: true }
  );
  backToTop.addEventListener('click', () => {
    smoothScrollTo('#hero', 0, 1.8);
  });

  const footer = document.querySelector('.footer');
  if (footer) {
    new IntersectionObserver((entries) => {
      backToTop.classList.toggle('fade-out', entries[0].isIntersecting);
    }).observe(footer);
  }
}
