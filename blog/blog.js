/* ============================================
   Blog System — All JavaScript
   Pure vanilla JS. No libraries. No localStorage.
   ============================================ */
(function () {
  'use strict';

  var currentCategory = 'all';
  var currentSort = 'newest';
  var currentPage = 1;
  var CARDS_PER_PAGE = 6;

  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.blog-grid')) initBlogIndex();
    if (document.querySelector('.post-content')) initBlogPost();
  });

  /* ════════════════════════════════════════
     BLOG INDEX
     ════════════════════════════════════════ */
  function initBlogIndex() {
    var params = new URLSearchParams(window.location.search);
    var catParam = params.get('category');
    if (catParam) currentCategory = catParam;

    initCategoryFilter();
    initSort();
    filterByCategory(currentCategory);
  }

  function getCards() {
    return Array.from(document.querySelectorAll('.blog-card'));
  }

  function getVisibleCards() {
    return getCards().filter(function (c) { return !c.classList.contains('hidden'); });
  }

  /* ── Category Filter ── */
  function initCategoryFilter() {
    document.querySelectorAll('.category-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        filterByCategory(pill.dataset.category);
      });
    });
    document.querySelectorAll('.sidebar-cat-item').forEach(function (item) {
      item.addEventListener('click', function () {
        filterByCategory(item.dataset.category);
      });
    });
  }

  function filterByCategory(category) {
    currentCategory = category;
    currentPage = 1;

    getCards().forEach(function (card) {
      if (category === 'all' || card.dataset.category === category) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });

    document.querySelectorAll('.category-pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.category === category);
    });
    document.querySelectorAll('.sidebar-cat-item').forEach(function (s) {
      s.classList.toggle('active', s.dataset.category === category);
    });

    sortCards(currentSort);
  }

  /* ── Sort ── */
  function initSort() {
    var sel = document.querySelector('.sort-select');
    if (sel) {
      sel.addEventListener('change', function () {
        currentSort = sel.value;
        currentPage = 1;
        sortCards(currentSort);
      });
    }
  }

  function sortCards(method) {
    var grid = document.querySelector('.blog-grid');
    if (!grid) return;

    var cards = getCards();
    var featured = null;
    var rest = [];

    cards.forEach(function (c) {
      if (c.dataset.featured === 'true') featured = c;
      else rest.push(c);
    });

    rest.sort(function (a, b) {
      if (method === 'newest') return b.dataset.date.localeCompare(a.dataset.date);
      if (method === 'oldest') return a.dataset.date.localeCompare(b.dataset.date);
      if (method === 'popular') return parseInt(b.dataset.popular) - parseInt(a.dataset.popular);
      return 0;
    });

    if (featured) grid.prepend(featured);
    rest.forEach(function (c) { grid.appendChild(c); });

    initPagination();
    updateBlogCount();
  }

  /* ── Pagination ── */
  function initPagination() {
    var visible = getVisibleCards();
    var totalPages = Math.ceil(visible.length / CARDS_PER_PAGE);
    if (totalPages < 1) totalPages = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    visible.forEach(function (card, i) {
      var page = Math.floor(i / CARDS_PER_PAGE) + 1;
      card.style.display = (page === currentPage) ? '' : 'none';
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    var container = document.querySelector('.pagination');
    if (!container) return;
    container.innerHTML = '';

    var prev = document.createElement('button');
    prev.className = 'pagination-btn';
    prev.textContent = '\u2190';
    prev.disabled = (currentPage <= 1);
    prev.addEventListener('click', function () { goToPage(currentPage - 1); });
    container.appendChild(prev);

    for (var i = 1; i <= totalPages; i++) {
      var btn = document.createElement('button');
      btn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      btn.addEventListener('click', (function (p) {
        return function () { goToPage(p); };
      })(i));
      container.appendChild(btn);
    }

    var next = document.createElement('button');
    next.className = 'pagination-btn';
    next.textContent = '\u2192';
    next.disabled = (currentPage >= totalPages);
    next.addEventListener('click', function () { goToPage(currentPage + 1); });
    container.appendChild(next);
  }

  function goToPage(page) {
    currentPage = page;
    initPagination();
    updateBlogCount();
    var grid = document.querySelector('.blog-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateBlogCount() {
    var el = document.querySelector('.blog-count');
    if (!el) return;
    var visible = getVisibleCards();
    var total = getCards().length;
    var showing = visible.filter(function (c) { return c.style.display !== 'none'; }).length;
    el.textContent = 'Showing ' + showing + ' of ' + visible.length + ' articles';
  }

  /* ════════════════════════════════════════
     BLOG POST
     ════════════════════════════════════════ */
  function initBlogPost() {
    initReadProgress();
    initTOC();
  }

  /* ── Read Progress ── */
  function initReadProgress() {
    var bar = document.getElementById('readProgress');
    if (!bar) return;
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var scrollTop = window.scrollY || document.documentElement.scrollTop;
          var docHeight = document.documentElement.scrollHeight - window.innerHeight;
          var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          bar.style.width = Math.min(progress, 100) + '%';
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ── Table of Contents ── */
  function initTOC() {
    var headings = document.querySelectorAll('.post-content h2, .post-content h3');
    headings.forEach(function (h) {
      if (!h.id) h.id = slugify(h.textContent);
    });

    var tocLinks = document.querySelectorAll('.toc-link');
    if (tocLinks.length === 0 || headings.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          tocLinks.forEach(function (l) { l.classList.remove('toc-active'); });
          var active = document.querySelector('.toc-link[href="#' + entry.target.id + '"]');
          if (active) active.classList.add('toc-active');
        }
      });
    }, { threshold: 0.5, rootMargin: '-80px 0px -60% 0px' });

    headings.forEach(function (h) { observer.observe(h); });
  }

  /* ════════════════════════════════════════
     SHARE FUNCTIONS (global)
     ════════════════════════════════════════ */
  window.sharePost = function (platform) {
    var url = encodeURIComponent(window.location.href);
    var text = encodeURIComponent(document.title);
    if (platform === 'twitter') {
      window.open('https://twitter.com/intent/tweet?url=' + url + '&text=' + text, '_blank', 'width=600,height=400');
    } else if (platform === 'linkedin') {
      window.open('https://www.linkedin.com/shareArticle?url=' + url, '_blank', 'width=600,height=500');
    }
  };

  window.copyPostURL = function () {
    var btn = document.querySelector('.share-btn:last-child') || document.querySelector('[onclick*="copyPostURL"]');
    navigator.clipboard.writeText(window.location.href).then(function () {
      if (btn) {
        var orig = btn.innerHTML;
        btn.innerHTML = '\u2713 Copied!';
        setTimeout(function () { btn.innerHTML = orig; }, 2000);
      }
    }).catch(function () {
      var ta = document.createElement('textarea');
      ta.value = window.location.href;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
  };

  /* ════════════════════════════════════════
     UTILITIES
     ════════════════════════════════════════ */
  function formatDate(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

})();
