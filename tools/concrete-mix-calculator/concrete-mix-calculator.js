/* ============================================
   Concrete Mix Ratio Calculator — Logic
   ============================================ */

(function () {
  'use strict';

  /* ── Constants ── */
  const GRADES = {
    C10:  { cement: 1, sand: 3,    agg: 6,   label: 'C10', desc: 'Lean mix, blinding, non-structural' },
    C15:  { cement: 1, sand: 2,    agg: 4,   label: 'C15', desc: 'Paths, steps, light foundations' },
    C20:  { cement: 1, sand: 1.5,  agg: 3,   label: 'C20', desc: 'General purpose, most residential' },
    C25:  { cement: 1, sand: 1,    agg: 2,   label: 'C25', desc: 'Suspended slabs, beams, columns' },
    C30:  { cement: 1, sand: 0.75, agg: 1.5, label: 'C30', desc: 'High strength structural' },
    C35:  { cement: 1, sand: 0.5,  agg: 1,   label: 'C35', desc: 'Bridges, heavy structures' },
    C40:  { cement: 1, sand: 0.4,  agg: 0.8, label: 'C40', desc: 'Very high strength, precast' }
  };

  const DRY_VOL_FACTOR   = 1.54;
  const CEMENT_DENSITY    = 1440;   // kg/m3
  const SAND_DENSITY      = 1600;
  const AGG_DENSITY       = 1550;
  const M3_PER_FT3        = 0.0283168;
  const M3_PER_YD3        = 0.764555;

  /* ── DOM Refs ── */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  /* ── Mode Toggle (Standard / Custom) ── */
  $$('.mode-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.mode-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      $$('.input-panel').forEach(p => p.classList.remove('active'));
      $(`.input-panel[data-panel="${mode}"]`).classList.add('active');
    });
  });

  /* ── Unit Toggle ── */
  $$('.unit-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.unit-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const unit = btn.dataset.unit;
      $('#volumeUnitLabel').textContent = unit;
    });
  });

  /* ── Segmented Controls (bag size, wastage) ── */
  document.addEventListener('click', (e) => {
    const seg = e.target.closest('.seg-btn');
    if (!seg) return;
    const group = seg.closest('.seg-control');
    group.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    seg.classList.add('active');
  });

  /* ── Advanced Toggle ── */
  const advToggle = $('.advanced-toggle');
  const advBody   = $('.advanced-body');
  if (advToggle && advBody) {
    advToggle.addEventListener('click', () => {
      advToggle.classList.toggle('open');
      advBody.classList.toggle('open');
    });
  }

  /* ── W/C Ratio Slider ── */
  const wcSlider = $('#wcRatio');
  const wcValue  = $('#wcValue');
  if (wcSlider && wcValue) {
    wcSlider.addEventListener('input', () => {
      wcValue.textContent = parseFloat(wcSlider.value).toFixed(2);
    });
  }

  /* ── Calculate ── */
  const calcBtn = $('#calcBtn');
  if (calcBtn) {
    calcBtn.addEventListener('click', calculate);
  }

  function calculate() {
    /* Get mix ratios */
    let cement, sand, agg, gradeLabel;
    const activeMode = $('.mode-toggle-btn.active').dataset.mode;

    if (activeMode === 'standard') {
      const gradeKey = $('#gradeSelect').value;
      const grade = GRADES[gradeKey];
      cement = grade.cement;
      sand   = grade.sand;
      agg    = grade.agg;
      gradeLabel = grade.label;
    } else {
      cement = parseFloat($('#customCement').value) || 1;
      sand   = parseFloat($('#customSand').value) || 1.5;
      agg    = parseFloat($('#customAgg').value) || 3;
      gradeLabel = 'Custom';
    }

    /* Volume */
    let volume = parseFloat($('#volumeInput').value) || 1;
    const unit = $('.unit-toggle-btn.active').dataset.unit;
    if (unit === 'ft\u00B3') volume *= M3_PER_FT3;
    else if (unit === 'yd\u00B3') volume *= M3_PER_YD3;

    /* Bag size */
    const bagSize = parseInt($('.seg-control[data-group="bag"] .seg-btn.active').dataset.value) || 50;

    /* Wastage */
    const wastage = parseInt($('.seg-control[data-group="wastage"] .seg-btn.active').dataset.value) || 5;

    /* W/C ratio */
    const wcRatio = parseFloat($('#wcRatio').value) || 0.50;

    /* Calculations */
    const totalParts = cement + sand + agg;
    const dryVolume  = volume * DRY_VOL_FACTOR * (1 + wastage / 100);

    const cementVol = dryVolume * (cement / totalParts);
    const sandVol   = dryVolume * (sand   / totalParts);
    const aggVol    = dryVolume * (agg    / totalParts);

    const cementKg  = cementVol * CEMENT_DENSITY;
    const sandKg    = sandVol   * SAND_DENSITY;
    const aggKg     = aggVol    * AGG_DENSITY;
    const waterL    = cementKg  * wcRatio;
    const bags      = Math.ceil(cementKg / bagSize);

    /* Display results */
    const ratioStr = `1 : ${sand} : ${agg}`;
    $('#resGrade').textContent      = gradeLabel === 'Custom' ? `Custom ${ratioStr}` : gradeLabel;
    $('#resRatio').textContent      = `Mix ratio ${ratioStr} by volume`;

    $('#resCementKg').textContent   = cementKg.toFixed(0);
    $('#resCementBags').textContent = `${bags} bags \u00D7 ${bagSize}kg`;

    $('#resSandVol').textContent    = sandVol.toFixed(3);
    $('#resSandKg').textContent     = `${sandKg.toFixed(0)} kg approx.`;

    $('#resAggVol').textContent     = aggVol.toFixed(3);
    $('#resAggKg').textContent      = `${aggKg.toFixed(0)} kg approx.`;

    $('#resWater').textContent      = waterL.toFixed(0);
    $('#resWcLabel').textContent    = `Based on w/c = ${wcRatio.toFixed(2)}`;

    $('#resDryVol').textContent     = dryVolume.toFixed(3);

    /* Show results box */
    $('.results-box').classList.add('visible');
    $('.results-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── FAQ Accordion ── */
  $$('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const wasActive = q.classList.contains('active');

      /* Close all */
      $$('.faq-question').forEach(qq => {
        qq.classList.remove('active');
        qq.querySelector('.faq-arrow').textContent = '\u25B8';
      });
      $$('.faq-answer').forEach(a => a.classList.remove('open'));

      /* Toggle current */
      if (!wasActive) {
        q.classList.add('active');
        q.querySelector('.faq-arrow').textContent = '\u25BE';
        q.nextElementSibling.classList.add('open');
      }
    });
  });

})();
