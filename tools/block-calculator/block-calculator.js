/* ============================================
   Concrete Block Calculator — Logic
   ============================================ */
(function () {
  'use strict';

  const MORTAR_FRAC    = 0.25;
  const DRY_VOL_FACTOR = 1.33;
  const CEMENT_DENSITY = 1440;
  const SAND_DENSITY   = 1600;
  const FT_TO_M        = 0.3048;

  const BLOCK_PRESETS = {
    '400x200x200': { l: 400, h: 200, w: 200 },
    '450x225x225': { l: 450, h: 225, w: 225 },
    '390x190x190': { l: 390, h: 190, w: 190 },
    '290x190x190': { l: 290, h: 190, w: 190 }
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  /* Mode toggle (area / LxH) */
  $$('.mode-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.mode-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.input-panel').forEach(p => p.classList.remove('active'));
      $(`.input-panel[data-panel="${btn.dataset.mode}"]`).classList.add('active');
    });
  });

  /* Unit toggle */
  $$('.unit-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.unit-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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

  /* Block size custom toggle */
  const sizeSelect = $('#blockSize');
  if (sizeSelect) {
    sizeSelect.addEventListener('change', () => {
      const custom = $('#customBlockPanel');
      if (custom) custom.classList.toggle('active', sizeSelect.value === 'custom');
    });
  }

  /* Mix ratio custom toggle */
  const mixSelect = $('#mixRatio');
  if (mixSelect) {
    mixSelect.addEventListener('change', () => {
      const custom = $('#customMixPanel');
      if (custom) custom.classList.toggle('active', mixSelect.value === 'custom');
    });
  }

  /* Advanced toggle (cost) */
  const advToggle = $('.advanced-toggle');
  const advBody = $('.advanced-body');
  if (advToggle && advBody) {
    advToggle.addEventListener('click', () => {
      advToggle.classList.toggle('open');
      advBody.classList.toggle('open');
    });
  }

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

    /* Block dimensions in mm */
    let blockL, blockH, blockW;
    const sizeVal = $('#blockSize').value;
    if (sizeVal === 'custom') {
      blockL = parseFloat($('#customBlockL').value) || 400;
      blockH = parseFloat($('#customBlockH').value) || 200;
      blockW = parseFloat($('#customBlockW').value) || 200;
    } else {
      const preset = BLOCK_PRESETS[sizeVal];
      blockL = preset.l; blockH = preset.h; blockW = preset.w;
    }

    const joint = parseFloat($('#jointThickness').value) || 15;
    const doubleSkin = ($('.seg-control[data-group="skin"] .seg-btn.active') || {}).dataset.value === 'double';
    const wastage = parseInt($('.seg-control[data-group="wastage"] .seg-btn.active').dataset.value) || 10;

    /* Mix ratio */
    const mixVal = $('#mixRatio').value;
    let cementParts, sandParts;
    if (mixVal === 'custom') {
      cementParts = parseFloat($('#customCement').value) || 1;
      sandParts = parseFloat($('#customSand').value) || 5;
    } else {
      const parts = mixVal.split(':');
      cementParts = parseFloat(parts[0]);
      sandParts = parseFloat(parts[1]);
    }

    const bagSize = parseInt($('.seg-control[data-group="bag"] .seg-btn.active').dataset.value) || 50;

    /* Block count */
    const faceArea = ((blockL + joint) / 1000) * ((blockH + joint) / 1000); // m2
    const blocksNet = wallArea / faceArea * (doubleSkin ? 2 : 1);
    const blocksOrder = Math.ceil(blocksNet * (1 + wastage / 100));
    const blocksPerM2 = 1 / faceArea;

    /* Mortar */
    const blockWidthM = blockW / 1000;
    const wallVolume = wallArea * blockWidthM * (doubleSkin ? 2 : 1);
    const mortarWet = wallVolume * MORTAR_FRAC * (1 + wastage / 100);
    const mortarDry = mortarWet * DRY_VOL_FACTOR;
    const totalParts = cementParts + sandParts;
    const cementVol = mortarDry * (cementParts / totalParts);
    const sandVol = mortarDry * (sandParts / totalParts);
    const cementKg = cementVol * CEMENT_DENSITY;
    const sandKg = sandVol * SAND_DENSITY;
    const bags = Math.ceil(cementKg / bagSize);

    /* Display */
    $('#resBlocksNet').textContent = Math.ceil(blocksNet);
    $('#resBlocksOrder').textContent = blocksOrder;
    $('#resBlocksPerM2').textContent = blocksPerM2.toFixed(1);
    $('#resMortarVol').textContent = mortarWet.toFixed(3);
    $('#resCementKg').textContent = cementKg.toFixed(0);
    $('#resCementBags').textContent = `${bags} bags \u00D7 ${bagSize}kg`;
    $('#resSandVol').textContent = sandVol.toFixed(3);
    $('#resWallArea').textContent = wallArea.toFixed(1);

    /* Cost (optional) */
    const priceInput = $('#blockPrice');
    const costCard = $('#resCostCard');
    if (priceInput && costCard) {
      const price = parseFloat(priceInput.value);
      if (price > 0) {
        costCard.classList.remove('hidden');
        $('#resCost').textContent = Math.ceil(blocksOrder * price).toLocaleString();
      } else {
        costCard.classList.add('hidden');
      }
    }

    $('.results-box').classList.add('visible');
    $('.results-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
