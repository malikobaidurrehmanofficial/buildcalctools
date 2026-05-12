/* ============================================
   Mortar Volume Calculator — Logic
   ============================================ */
(function () {
  'use strict';

  const MORTAR_FRAC_BRICK = 0.30;
  const MORTAR_FRAC_BLOCK = 0.25;
  const DRY_VOL_FACTOR    = 1.33;
  const CEMENT_DENSITY    = 1440;
  const SAND_DENSITY      = 1600;
  const FT_TO_M           = 0.3048;
  const WALL_THICK = {
    'single-brick': 0.114,
    'double-brick': 0.228,
    'single-block': 0.200,
    'double-block': 0.400
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  /* Mode toggle (area / L×H) */
  $$('.mode-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.mode-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.input-panel').forEach(p => p.classList.remove('active'));
      $(`.input-panel[data-panel="${btn.dataset.mode}"]`).classList.add('active');
    });
  });

  /* Segmented controls */
  document.addEventListener('click', (e) => {
    const seg = e.target.closest('.seg-btn');
    if (!seg) return;
    const group = seg.closest('.seg-control');
    group.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    seg.classList.add('active');
  });

  /* Unit toggle */
  $$('.unit-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.unit-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* Calculate */
  const calcBtn = $('#calcBtn');
  if (calcBtn) calcBtn.addEventListener('click', calculate);

  function calculate() {
    const isImperial = ($('.unit-toggle-btn.active') || {}).dataset.unit === 'imperial';
    const areaMode = ($('.mode-toggle-btn.active') || {}).dataset.mode;

    let wallArea;
    if (areaMode === 'area') {
      wallArea = parseFloat($('#wallArea').value) || 0;
      if (isImperial) wallArea *= (FT_TO_M * FT_TO_M);
    } else {
      let l = parseFloat($('#wallLength').value) || 0;
      let h = parseFloat($('#wallHeight').value) || 0;
      if (isImperial) { l *= FT_TO_M; h *= FT_TO_M; }
      wallArea = l * h;
    }

    const wallType = ($('.seg-control[data-group="walltype"] .seg-btn.active') || {}).dataset.value || 'single-brick';
    const wallThick = WALL_THICK[wallType] || 0.114;
    const isBrick = wallType.includes('brick');
    const mortarFrac = isBrick ? MORTAR_FRAC_BRICK : MORTAR_FRAC_BLOCK;

    const mixRatioStr = $('#mixRatio').value;
    let cementParts, sandParts;
    if (mixRatioStr === 'custom') {
      cementParts = parseFloat($('#customCement').value) || 1;
      sandParts = parseFloat($('#customSand').value) || 5;
    } else {
      const parts = mixRatioStr.split(':');
      cementParts = parseFloat(parts[0]);
      sandParts = parseFloat(parts[1]);
    }

    const bagSize = parseInt($('.seg-control[data-group="bag"] .seg-btn.active').dataset.value) || 50;
    const wastage = parseInt($('.seg-control[data-group="wastage"] .seg-btn.active').dataset.value) || 10;

    const wallVolume = wallArea * wallThick;
    const mortarWet = wallVolume * mortarFrac * (1 + wastage / 100);
    const mortarDry = mortarWet * DRY_VOL_FACTOR;
    const totalParts = cementParts + sandParts;
    const cementVol = mortarDry * (cementParts / totalParts);
    const sandVol = mortarDry * (sandParts / totalParts);
    const cementKg = cementVol * CEMENT_DENSITY;
    const sandKg = sandVol * SAND_DENSITY;
    const bags = Math.ceil(cementKg / bagSize);

    $('#resMortarVol').textContent = mortarWet.toFixed(3);
    $('#resDryVol').textContent = mortarDry.toFixed(3);
    $('#resCementKg').textContent = cementKg.toFixed(0);
    $('#resCementBags').textContent = `${bags} bags \u00D7 ${bagSize}kg`;
    $('#resSandVol').textContent = sandVol.toFixed(3);
    $('#resSandKg').textContent = `${sandKg.toFixed(0)} kg approx.`;

    $('.results-box').classList.add('visible');
    $('.results-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Custom mix toggle */
  const mixSelect = $('#mixRatio');
  if (mixSelect) {
    mixSelect.addEventListener('change', () => {
      const custom = $('#customMixPanel');
      if (custom) custom.classList.toggle('active', mixSelect.value === 'custom');
    });
  }

  /* FAQ */
  $$('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const wasActive = q.classList.contains('active');
      $$('.faq-question').forEach(qq => { qq.classList.remove('active'); qq.querySelector('.faq-arrow').textContent = '\u25B8'; });
      $$('.faq-answer').forEach(a => a.classList.remove('open'));
      if (!wasActive) { q.classList.add('active'); q.querySelector('.faq-arrow').textContent = '\u25BE'; q.nextElementSibling.classList.add('open'); }
    });
  });
})();
