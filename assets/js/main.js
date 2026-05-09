/* ============================================
   BuildCalcTools — main.js  v4
   Theme system, navbar + footer injection,
   mobile menu, lazy images, scroll animations
   ============================================ */

/* ── Theme Engine ── */
(function initTheme() {
  const stored = localStorage.getItem('bct-theme');
  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bct-theme', next);
}

/* Listen for OS-level theme changes */
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (!localStorage.getItem('bct-theme')) {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});

/* ── SVG Icons ── */
const ICON_SUN = `<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const ICON_MOON = `<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

/* ── Navbar HTML ── */
const NAV_HTML = `
<nav class="navbar" id="mainNavbar">
  <div class="container navbar-inner">
    <a href="/index.html" class="nav-logo">
      <img src="/assets/img/logo.png" alt="BuildCalcTools" class="nav-logo-img">
    </a>
    <div class="nav-links" id="navLinks">
      <a href="/index.html">Home</a>
      <a href="/tools/">Calculators</a>
      <a href="/blog/">Blog</a>
      <a href="/about/">About</a>
    </div>
    <div class="nav-right">
      <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark/light theme" title="Toggle theme">
        ${ICON_SUN}${ICON_MOON}
      </button>
      <button class="nav-hamburger" id="navToggle" aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>`;

/* ── Footer HTML ── */
const FOOTER_HTML = `
<footer class="footer">
  <div class="container">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="/index.html" class="nav-logo">
          <img src="/assets/img/logo.png" alt="BuildCalcTools" class="nav-logo-img">
        </a>
        <p>Free construction calculators for engineers, contractors and builders. No signup ever required.</p>
      </div>
      <div class="footer-col">
        <div class="footer-links-group">
          <span class="footer-links-title">Calculators</span>
          <a href="/tools/concrete-calculator.html">Concrete Calculator</a>
          <a href="/tools/brick-calculator.html">Brick Calculator</a>
          <a href="/tools/steel-calculator.html">Steel Calculator</a>
          <a href="/tools/">All Tools</a>
        </div>
      </div>
      <div class="footer-col">
        <div class="footer-links-group">
          <span class="footer-links-title">Site</span>
          <a href="/about/">About</a>
          <a href="/blog/">Blog</a>
          <a href="/contact/">Contact</a>
        </div>
      </div>
      <div class="footer-col">
        <div class="footer-links-group">
          <span class="footer-links-title">Legal</span>
          <a href="/privacy-policy/">Privacy Policy</a>
          <a href="/terms/">Terms of Use</a>
          <a href="/disclaimer/">Disclaimer</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span id="fyear"></span> BuildCalcTools.site &mdash; All rights reserved.</p>
      <span class="footer-free-badge">✦ Free Tool — No Signup Needed</span>
      <p>Built by <a href="/about/" style="color:var(--color-primary);">Malik Obaid Ur Rehman</a></p>
    </div>
  </div>
</footer>`;

document.addEventListener('DOMContentLoaded', () => {

  /* ── Inject navbar ── */
  const nb = document.getElementById('navbar');
  if (nb) { nb.outerHTML = NAV_HTML; }

  /* ── Inject footer ── */
  const ft = document.getElementById('footer');
  if (ft) { ft.outerHTML = FOOTER_HTML; }

  /* ── Current year ── */
  const yr = document.getElementById('fyear');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ── Theme toggle button ── */
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  /* ── Active nav highlight ── */
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === '/index.html' && (path === '/' || path === '/index.html')) {
      a.classList.add('active');
    } else if (href !== '/index.html' && href.length > 1 && path.startsWith(href.replace('index.html', ''))) {
      a.classList.add('active');
    }
  });

  /* ── Mobile hamburger ── */
  document.addEventListener('click', e => {
    const toggle = document.getElementById('navToggle');
    const links  = document.getElementById('navLinks');
    if (!toggle || !links) return;
    if (toggle.contains(e.target)) {
      links.classList.toggle('open');
      toggle.classList.toggle('is-open');
    } else if (!links.contains(e.target)) {
      links.classList.remove('open');
      toggle.classList.remove('is-open');
    }
  });

  /* ── Lazy image loading ── */
  if ('IntersectionObserver' in window) {
    const imgObs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        img.addEventListener('load',  () => img.classList.add('img-loaded'), { once: true });
        img.addEventListener('error', () => img.style.display = 'none',     { once: true });
        o.unobserve(img);
      });
    }, { rootMargin: '300px 0px' });
    document.querySelectorAll('img[data-src]').forEach(i => imgObs.observe(i));
  } else {
    document.querySelectorAll('img[data-src]').forEach(i => { i.src = i.dataset.src; });
  }

  /* ── Scroll-in animations ──
     Content starts visible. We add .anim-ready to body to enable
     the CSS that hides .anim-up elements, then IntersectionObserver
     reveals them. This prevents content from being permanently
     hidden if JS fails or observer doesn't fire. */
  if ('IntersectionObserver' in window) {
    const animEls = document.querySelectorAll('.anim-up');
    if (animEls.length > 0) {
      /* Enable animation CSS */
      document.body.classList.add('anim-ready');

      const animObs = new IntersectionObserver((entries, o) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('anim-visible');
          o.unobserve(entry.target);
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });

      animEls.forEach(el => animObs.observe(el));
    }
  }

  /* ── Navbar scroll shadow ── */
  let lastScroll = 0;
  const navbar = document.getElementById('mainNavbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY > 10) {
        navbar.style.boxShadow = 'var(--shadow-md)';
      } else {
        navbar.style.boxShadow = 'none';
      }
      lastScroll = scrollY;
    }, { passive: true });
  }

});