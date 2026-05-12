/* ============================================
   Rebar / Steel Bar Estimator — Logic
   ============================================ */

(function () {
  'use strict';

  /* ── Constants ── */
  const STEEL_DENSITY = 7850; // kg/m3
  const FT_TO_M = 0.3048;
  const IN_TO_MM = 25.4;

  /* Bar weight per metre: (d^2 / 162) kg/m */
  function weightPerMetre(dia) {
    return (dia * dia) / 162;
  }

  /* ── DOM Refs ── */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  /* ── Tabs ── */
  $$('.shape-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.shape-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      $$('.input-panel').forEach(p => p.classList.remove('active'));
      $(`.input-panel[data-panel="${target}"]`).classList.add('active');
    });
  });

  /* ── Unit Toggle ── */
  $$('.unit-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.unit-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  /* ── Segmented Controls ── */
  document.addEventListener('click', (e) => {
    const seg = e.target.closest('.seg-btn');
    if (!seg) return;
    const group = seg.closest('.seg-control');
    group.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    seg.classList.add('active');
  });

  /* ── Advanced Toggle (price) ── */
  const advToggle = $('.advanced-toggle');
  const advBody = $('.advanced-body');
  if (advToggle && advBody) {
    advToggle.addEventListener('click', () => {
      advToggle.classList.toggle('open');
      advBody.classList.toggle('open');
    });
  }

  /* ── Calculate ── */
  const calcBtn = $('#calcBtn');
  if (calcBtn) calcBtn.addEventListener('click', calculate);

  function getUnit() {
    const active = $('.unit-toggle-btn.active');
    return active ? active.dataset.unit : 'metric';
  }

  function toMetres(val) {
    return getUnit() === 'imperial' ? val * FT_TO_M : val;
  }

  function toMM(val) {
    return getUnit() === 'imperial' ? val * IN_TO_MM : val;
  }

  function calculate() {
    const activeTab = $('.shape-tab.active').dataset.tab;
    const wastage = parseInt($('.seg-control[data-group="wastage"] .seg-btn.active').dataset.value) || 5;
    const wastageFactor = 1 + wastage / 100;

    let totalBars = 0, totalLength = 0, totalWeight = 0;
    let stirrupCount = 0, stirrupTotalLen = 0;
    let barDia = 12, spacing = 150;

    if (activeTab === 'slab') {
      const length = toMetres(parseFloat($('#slabLength').value) || 0);
      const width = toMetres(parseFloat($('#slabWidth').value) || 0);
      barDia = parseInt($('#slabBarDia').value) || 12;
      spacing = toMM(parseFloat($('#slabSpacing').value) || 150) / 1000; // to metres
      const layers = parseInt($('.seg-control[data-group="layers"] .seg-btn.active').dataset.value) || 2;
      const lapMM = parseFloat($('#slabLap').value) || 500;
      const lapM = lapMM / 1000;

      const barsX = Math.ceil(width / spacing) + 1;
      const barsY = Math.ceil(length / spacing) + 1;
      totalBars = (barsX + barsY) * layers;

      const barLenX = length + lapM;
      const barLenY = width + lapM;
      totalLength = ((barsX * barLenX) + (barsY * barLenY)) * layers * wastageFactor;
      totalWeight = totalLength * weightPerMetre(barDia);
      spacing = spacing * 1000; // back to mm for display

    } else if (activeTab === 'beam') {
      const elemLength = toMetres(parseFloat($('#beamLength').value) || 0);
      const numBars = parseInt($('#beamBars').value) || 4;
      barDia = parseInt($('#beamBarDia').value) || 16;
      const stirrupDia = parseInt($('#stirrupDia').value) || 10;
      const stirrupSpacingMM = toMM(parseFloat($('#stirrupSpacing').value) || 200);
      const beamWidth = toMetres(parseFloat($('#beamWidth').value) || 0.3);
      const beamHeight = toMetres(parseFloat($('#beamHeight').value) || 0.5);

      const mainLen = numBars * elemLength * wastageFactor;
      const mainWt = mainLen * weightPerMetre(barDia);

      const stirrupPerim = 2 * (beamWidth + beamHeight) + 0.1; // +100mm hooks
      stirrupCount = Math.ceil((elemLength * 1000) / stirrupSpacingMM) + 1;
      stirrupTotalLen = stirrupCount * stirrupPerim * wastageFactor;
      const stirrupWt = stirrupTotalLen * weightPerMetre(stirrupDia);

      totalBars = numBars;
      totalLength = mainLen + stirrupTotalLen;
      totalWeight = mainWt + stirrupWt;

    } else if (activeTab === 'footing') {
      const fLength = toMetres(parseFloat($('#footLength').value) || 0);
      const fWidth = toMetres(parseFloat($('#footWidth').value) || 0);
      barDia = parseInt($('#footBarDia').value) || 12;
      spacing = toMM(parseFloat($('#footSpacing').value) || 200) / 1000;

      const barsL = Math.ceil(fWidth / spacing) + 1;
      const barsW = Math.ceil(fLength / spacing) + 1;
      totalBars = barsL + barsW;
      totalLength = (barsL * fLength + barsW * fWidth) * wastageFactor;
      totalWeight = totalLength * weightPerMetre(barDia);
      spacing = spacing * 1000;
    }

    /* Display results */
    $('#resTotalBars').textContent = totalBars;
    $('#resTotalLength').textContent = totalLength.toFixed(1);
    $('#resTotalWeightKg').textContent = totalWeight.toFixed(1);
    $('#resTotalWeightT').textContent = (totalWeight / 1000).toFixed(3);

    /* Spacing display (slab/footing only) */
    const spacingCard = $('#resSpacingCard');
    if (spacingCard) {
      if (activeTab === 'slab' || activeTab === 'footing') {
        spacingCard.classList.remove('hidden');
        $('#resSpacing').textContent = spacing.toFixed(0);
      } else {
        spacingCard.classList.add('hidden');
      }
    }

    /* Stirrup display (beam only) */
    const stirrupCard = $('#resStirrupCard');
    const stirrupLenCard = $('#resStirrupLenCard');
    if (stirrupCard) {
      if (activeTab === 'beam') {
        stirrupCard.classList.remove('hidden');
        stirrupLenCard.classList.remove('hidden');
        $('#resStirrupCount').textContent = stirrupCount;
        $('#resStirrupLen').textContent = stirrupTotalLen.toFixed(1);
      } else {
        stirrupCard.classList.add('hidden');
        stirrupLenCard.classList.add('hidden');
      }
    }

    /* Cost estimate (optional) */
    const priceInput = $('#steelPrice');
    const costCard = $('#resCostCard');
    if (priceInput && costCard) {
      const price = parseFloat(priceInput.value);
      if (price > 0) {
        costCard.classList.remove('hidden');
        $('#resCost').textContent = Math.ceil(totalWeight * price).toLocaleString();
      } else {
        costCard.classList.add('hidden');
      }
    }

    /* Show results */
    $('.results-box').classList.add('visible');
    $('.results-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── FAQ Accordion ── */
  $$('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const wasActive = q.classList.contains('active');
      $$('.faq-question').forEach(qq => {
        qq.classList.remove('active');
        qq.querySelector('.faq-arrow').textContent = '\u25B8';
      });
      $$('.faq-answer').forEach(a => a.classList.remove('open'));
      if (!wasActive) {
        q.classList.add('active');
        q.querySelector('.faq-arrow').textContent = '\u25BE';
        q.nextElementSibling.classList.add('open');
      }
    });
  });

})();
