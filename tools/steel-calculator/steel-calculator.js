/* ============================================
   Steel Weight Calculator — Logic
   Pure vanilla JS, no libraries.
   ============================================ */
(function () {
  'use strict';

  const STEEL_DENSITY = 7850;
  const LB_PER_KG = 2.20462;
  const MM_PER_IN = 25.4;
  const M_PER_FT = 0.3048;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  let currentUnit = 'metric';
  let currentWastage = 0;
  let currentTab = 'round';

  /* ── I-beam standard data [h, flangeW, flangeT, webT, kgm] ── */
  const IBEAM_DATA = [
    { label: '100\u00D750\u00D75mm', h: 100, fw: 50, ft: 5, wt: 5, kgm: 8.1 },
    { label: '150\u00D775\u00D76mm', h: 150, fw: 75, ft: 6, wt: 6, kgm: 14.9 },
    { label: '200\u00D7100\u00D77mm', h: 200, fw: 100, ft: 7, wt: 7, kgm: 26.2 },
    { label: '250\u00D7125\u00D78mm', h: 250, fw: 125, ft: 8, wt: 8, kgm: 37.3 },
    { label: '300\u00D7150\u00D79mm', h: 300, fw: 150, ft: 9, wt: 9, kgm: 52.4 },
    { label: '350\u00D7165\u00D711mm', h: 350, fw: 165, ft: 11, wt: 11, kgm: 67.2 },
    { label: '400\u00D7180\u00D713mm', h: 400, fw: 180, ft: 13, wt: 13, kgm: 93.0 }
  ];

  /* ══════════════════════════════════════ */
  /*  1. initPage                          */
  /* ══════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    /* Tabs */
    $$('.calc-tab').forEach(function (tab) {
      tab.addEventListener('click', function () { switchTab(tab.dataset.tab); });
    });
    switchTab('round');

    /* Unit pills */
    $$('.unit-pill').forEach(function (pill) {
      pill.addEventListener('click', function () { setUnit(pill.dataset.unit); });
    });

    /* Wastage */
    $$('.wastage-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setWastage(parseInt(btn.dataset.value)); });
    });

    /* Sub-mode toggles (I-beam, Angle) */
    $$('.sub-mode-toggle .unit-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var panel = pill.closest('.tab-panel');
        var group = pill.closest('.sub-mode-toggle');
        group.querySelectorAll('.unit-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        setSubMode(panel.id, pill.dataset.mode);
      });
    });

    /* Standard I-beam select */
    var ibeamSelect = $('#ibeamSelect');
    if (ibeamSelect) ibeamSelect.addEventListener('change', updateKgPerMetre);
    updateKgPerMetre();

    /* Calculate button */
    var calcBtn = $('#calcBtn');
    if (calcBtn) calcBtn.addEventListener('click', calculate);

    /* Copy / Print */
    var copyBtn = $('#copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyResults);
    var printBtn = $('#printBtn');
    if (printBtn) printBtn.addEventListener('click', printResults);

    /* Live recalculate on input */
    $$('.tab-panel input, .tab-panel select').forEach(function (el) {
      el.addEventListener('input', function () {
        if ($('.result-box') && $('.result-box').classList.contains('visible')) calculate();
      });
    });

    initFAQ();
  });

  /* ══════════════════════════════════════ */
  /*  2. setUnit                           */
  /* ══════════════════════════════════════ */
  function setUnit(unit) {
    currentUnit = unit;
    $$('.unit-pill[data-unit]').forEach(function (p) {
      p.classList.toggle('active', p.dataset.unit === unit);
    });
    /* Update labels */
    $$('[data-label-metric]').forEach(function (el) {
      el.textContent = unit === 'metric' ? el.dataset.labelMetric : el.dataset.labelImperial;
    });
    if ($('.result-box') && $('.result-box').classList.contains('visible')) calculate();
  }

  /* ══════════════════════════════════════ */
  /*  3. switchTab                         */
  /* ══════════════════════════════════════ */
  function switchTab(tabId) {
    currentTab = tabId;
    $$('.calc-tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tabId); });
    $$('.tab-panel').forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + tabId); });
    var rb = $('.result-box');
    if (rb) rb.classList.remove('visible');
  }

  /* ══════════════════════════════════════ */
  /*  4. setWastage                        */
  /* ══════════════════════════════════════ */
  function setWastage(pct) {
    currentWastage = pct;
    $$('.wastage-btn').forEach(function (b) { b.classList.toggle('active', parseInt(b.dataset.value) === pct); });
    if ($('.result-box') && $('.result-box').classList.contains('visible')) calculate();
  }

  /* ══════════════════════════════════════ */
  /*  5. setSubMode                        */
  /* ══════════════════════════════════════ */
  function setSubMode(panelId, mode) {
    var panel = $('#' + panelId);
    if (!panel) return;
    panel.querySelectorAll('.sub-panel').forEach(function (sp) {
      sp.classList.toggle('active', sp.dataset.submode === mode);
    });
  }

  /* ══════════════════════════════════════ */
  /*  6. updateKgPerMetre                  */
  /* ══════════════════════════════════════ */
  function updateKgPerMetre() {
    var sel = $('#ibeamSelect');
    var disp = $('#kgpmDisplay');
    if (!sel || !disp) return;
    var idx = sel.selectedIndex;
    if (idx >= 0 && idx < IBEAM_DATA.length) {
      disp.textContent = IBEAM_DATA[idx].kgm.toFixed(1) + ' kg/m';
    }
  }

  /* ══════════════════════════════════════ */
  /*  7. validateInputs                    */
  /* ══════════════════════════════════════ */
  function validateInputs() {
    var valid = true;
    var panel = $('#panel-' + currentTab);
    if (!panel) return false;
    /* Only check visible sub-panel inputs */
    var activeSubPanels = panel.querySelectorAll('.sub-panel.active');
    var inputs;
    if (activeSubPanels.length > 0) {
      inputs = [];
      activeSubPanels.forEach(function (sp) {
        sp.querySelectorAll('input[type="number"]').forEach(function (i) { inputs.push(i); });
      });
      /* Also get inputs outside sub-panels */
      panel.querySelectorAll(':scope > .form-group input[type="number"], :scope > .form-row input[type="number"]').forEach(function (i) { inputs.push(i); });
    } else {
      inputs = panel.querySelectorAll('input[type="number"]');
    }
    /* Clear previous errors */
    panel.querySelectorAll('.field-error-msg').forEach(function (e) { e.classList.remove('visible'); });
    panel.querySelectorAll('.form-input').forEach(function (i) { i.style.borderColor = ''; });

    inputs.forEach(function (inp) {
      var v = parseFloat(inp.value);
      if (isNaN(v) || v <= 0) {
        inp.style.borderColor = 'var(--color-primary)';
        var err = inp.parentElement.querySelector('.field-error-msg');
        if (err) err.classList.add('visible');
        valid = false;
      }
    });
    return valid;
  }

  /* ══════════════════════════════════════ */
  /*  8. calculate                         */
  /* ══════════════════════════════════════ */
  function calculate() {
    if (!validateInputs()) return;

    var isMetric = currentUnit === 'metric';
    var toM = function (v) { return isMetric ? v / 1000 : v * MM_PER_IN / 1000; };
    var lengthToM = function (v) { return isMetric ? v : v * M_PER_FT; };

    var weightPerMetre = 0;
    var length = 0;
    var quantity = 1;
    var sectionLabel = '';

    switch (currentTab) {
      case 'round': {
        var d = toM(parseFloat($('#roundDia').value) || 0);
        length = lengthToM(parseFloat($('#roundLen').value) || 0);
        quantity = parseInt($('#roundQty').value) || 1;
        var area = Math.PI / 4 * d * d;
        weightPerMetre = area * STEEL_DENSITY;
        var dMM = isMetric ? parseFloat($('#roundDia').value) : (parseFloat($('#roundDia').value) * MM_PER_IN);
        sectionLabel = 'Round Bar \u2300' + dMM.toFixed(1) + 'mm';
        break;
      }
      case 'square': {
        var s = toM(parseFloat($('#sqSide').value) || 0);
        length = lengthToM(parseFloat($('#sqLen').value) || 0);
        quantity = parseInt($('#sqQty').value) || 1;
        weightPerMetre = s * s * STEEL_DENSITY;
        var sMM = isMetric ? parseFloat($('#sqSide').value) : (parseFloat($('#sqSide').value) * MM_PER_IN);
        sectionLabel = 'Square Bar ' + sMM.toFixed(0) + 'mm';
        break;
      }
      case 'flat': {
        var w = toM(parseFloat($('#flatW').value) || 0);
        var t = toM(parseFloat($('#flatT').value) || 0);
        length = lengthToM(parseFloat($('#flatLen').value) || 0);
        quantity = parseInt($('#flatQty').value) || 1;
        weightPerMetre = w * t * STEEL_DENSITY;
        var wMM = isMetric ? parseFloat($('#flatW').value) : (parseFloat($('#flatW').value) * MM_PER_IN);
        var tMM = isMetric ? parseFloat($('#flatT').value) : (parseFloat($('#flatT').value) * MM_PER_IN);
        sectionLabel = 'Flat Bar ' + wMM.toFixed(0) + '\u00D7' + tMM.toFixed(0) + 'mm';
        break;
      }
      case 'ibeam': {
        length = lengthToM(parseFloat($('#ibeamLen').value) || 0);
        quantity = parseInt($('#ibeamQty').value) || 1;
        var ibeamMode = $('#panel-ibeam .sub-mode-toggle .unit-pill.active');
        if (ibeamMode && ibeamMode.dataset.mode === 'standard') {
          var idx = $('#ibeamSelect').selectedIndex;
          weightPerMetre = IBEAM_DATA[idx].kgm;
          sectionLabel = 'I-Beam ' + IBEAM_DATA[idx].label;
        } else {
          var ih = toM(parseFloat($('#ibeamH').value) || 0);
          var ifw = toM(parseFloat($('#ibeamFW').value) || 0);
          var ift = toM(parseFloat($('#ibeamFT').value) || 0);
          var iwt = toM(parseFloat($('#ibeamWT').value) || 0);
          var webH = ih - 2 * ift;
          if (webH < 0) webH = 0;
          var area = 2 * (ifw * ift) + (webH * iwt);
          weightPerMetre = area * STEEL_DENSITY;
          sectionLabel = 'I-Beam (Custom)';
        }
        break;
      }
      case 'channel': {
        var ch = toM(parseFloat($('#chH').value) || 0);
        var cfw = toM(parseFloat($('#chFW').value) || 0);
        var cft = toM(parseFloat($('#chFT').value) || 0);
        var cwt = toM(parseFloat($('#chWT').value) || 0);
        length = lengthToM(parseFloat($('#chLen').value) || 0);
        quantity = parseInt($('#chQty').value) || 1;
        var webH = ch - 2 * cft;
        if (webH < 0) webH = 0;
        weightPerMetre = (cfw * cft * 2 + webH * cwt) * STEEL_DENSITY;
        sectionLabel = 'Channel Section';
        break;
      }
      case 'angle': {
        length = lengthToM(parseFloat($('#angLen').value) || 0);
        quantity = parseInt($('#angQty').value) || 1;
        var angMode = $('#panel-angle .sub-mode-toggle .unit-pill.active');
        if (angMode && angMode.dataset.mode === 'equal') {
          var leg = toM(parseFloat($('#angLeg').value) || 0);
          var at = toM(parseFloat($('#angT').value) || 0);
          weightPerMetre = (2 * leg * at - at * at) * STEEL_DENSITY;
          sectionLabel = 'Equal Angle';
        } else {
          var la = toM(parseFloat($('#angLegA').value) || 0);
          var lb = toM(parseFloat($('#angLegB').value) || 0);
          var at = toM(parseFloat($('#angTU').value) || 0);
          weightPerMetre = (la + lb - at) * at * STEEL_DENSITY;
          sectionLabel = 'Unequal Angle';
        }
        break;
      }
      case 'shs': {
        var ow = toM(parseFloat($('#shsW').value) || 0);
        var wt = toM(parseFloat($('#shsT').value) || 0);
        length = lengthToM(parseFloat($('#shsLen').value) || 0);
        quantity = parseInt($('#shsQty').value) || 1;
        var iw = ow - 2 * wt;
        if (iw < 0) iw = 0;
        weightPerMetre = (ow * ow - iw * iw) * STEEL_DENSITY;
        sectionLabel = 'SHS ' + (isMetric ? parseFloat($('#shsW').value) : (parseFloat($('#shsW').value) * MM_PER_IN)).toFixed(0) + 'mm';
        break;
      }
      case 'rhs': {
        var rw = toM(parseFloat($('#rhsW').value) || 0);
        var rh = toM(parseFloat($('#rhsH').value) || 0);
        var rt = toM(parseFloat($('#rhsT').value) || 0);
        length = lengthToM(parseFloat($('#rhsLen').value) || 0);
        quantity = parseInt($('#rhsQty').value) || 1;
        var riw = rw - 2 * rt;
        var rih = rh - 2 * rt;
        if (riw < 0) riw = 0;
        if (rih < 0) rih = 0;
        weightPerMetre = (rw * rh - riw * rih) * STEEL_DENSITY;
        sectionLabel = 'RHS';
        break;
      }
      case 'chs': {
        var od = toM(parseFloat($('#chsOD').value) || 0);
        var ct = toM(parseFloat($('#chsT').value) || 0);
        length = lengthToM(parseFloat($('#chsLen').value) || 0);
        quantity = parseInt($('#chsQty').value) || 1;
        var id = od - 2 * ct;
        if (id < 0) id = 0;
        weightPerMetre = Math.PI / 4 * (od * od - id * id) * STEEL_DENSITY;
        sectionLabel = 'CHS / Pipe \u2300' + (isMetric ? parseFloat($('#chsOD').value) : (parseFloat($('#chsOD').value) * MM_PER_IN)).toFixed(0) + 'mm';
        break;
      }
    }

    var weightPerPiece = weightPerMetre * length;
    var totalWeight = weightPerPiece * quantity * (1 + currentWastage / 100);
    var totalLength = length * quantity;

    /* Populate results */
    $('#resSectionType').textContent = sectionLabel;
    $('#resKgPerM').textContent = weightPerMetre.toFixed(3) + ' kg/m';

    if (isMetric) {
      $('#resPerUnit').textContent = weightPerPiece.toFixed(2);
      $('#resPerUnitUnit').textContent = 'kg';
      $('#resPerUnitSub').textContent = 'Single piece \u00D7 ' + length.toFixed(2) + 'm';
      $('#resTotalKg').textContent = totalWeight.toFixed(2);
      $('#resTotalKgUnit').textContent = 'kg';
      $('#resTotalTonnes').textContent = (totalWeight / 1000).toFixed(4);
      $('#resTotalTonnesUnit').textContent = 'tonnes';
      $('#resTotalLen').textContent = totalLength.toFixed(2);
      $('#resTotalLenUnit').textContent = 'm';
      $('#resKgPerMVal').textContent = weightPerMetre.toFixed(3);
      $('#resKgPerMUnit').textContent = 'kg/m';
    } else {
      var lbPP = weightPerPiece * LB_PER_KG;
      var lbTotal = totalWeight * LB_PER_KG;
      $('#resPerUnit').textContent = lbPP.toFixed(2);
      $('#resPerUnitUnit').textContent = 'lb';
      $('#resPerUnitSub').textContent = 'Single piece \u00D7 ' + (length / M_PER_FT).toFixed(2) + 'ft';
      $('#resTotalKg').textContent = lbTotal.toFixed(2);
      $('#resTotalKgUnit').textContent = 'lb';
      $('#resTotalTonnes').textContent = (totalWeight / 1000).toFixed(4);
      $('#resTotalTonnesUnit').textContent = 'tonnes';
      $('#resTotalLen').textContent = (totalLength / M_PER_FT).toFixed(2);
      $('#resTotalLenUnit').textContent = 'ft';
      $('#resKgPerMVal').textContent = (weightPerMetre * LB_PER_KG / M_PER_FT).toFixed(3);
      $('#resKgPerMUnit').textContent = 'lb/ft';
    }

    $('#resTotalSub').textContent = quantity + ' piece(s)';
    $('#resTotalLenSub').textContent = quantity + ' \u00D7 ' + (isMetric ? length.toFixed(2) + 'm' : (length / M_PER_FT).toFixed(2) + 'ft');

    /* Show/hide kg/m card if qty > 1 */
    var kgmCard = $('#resKgPerMCard');
    if (kgmCard) kgmCard.style.display = quantity > 1 ? '' : 'none';

    var rb = $('.result-box');
    rb.classList.add('visible');
    rb.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ══════════════════════════════════════ */
  /*  9. copyResults                       */
  /* ══════════════════════════════════════ */
  function copyResults() {
    var section = ($('#resSectionType') || {}).textContent || '';
    var kgm = ($('#resKgPerM') || {}).textContent || '';
    var perUnit = ($('#resPerUnit') || {}).textContent || '';
    var totalKg = ($('#resTotalKg') || {}).textContent || '';
    var totalT = ($('#resTotalTonnes') || {}).textContent || '';
    var totalLen = ($('#resTotalLen') || {}).textContent || '';

    var text = 'Steel Weight Calculation\n' +
      'Section: ' + section + '\n' +
      'Weight/m: ' + kgm + '\n' +
      'Per piece: ' + perUnit + ' ' + (($('#resPerUnitUnit') || {}).textContent || '') + '\n' +
      'Total: ' + totalKg + ' ' + (($('#resTotalKgUnit') || {}).textContent || '') + '\n' +
      'Total: ' + totalT + ' ' + (($('#resTotalTonnesUnit') || {}).textContent || '') + '\n' +
      'Total length: ' + totalLen + ' ' + (($('#resTotalLenUnit') || {}).textContent || '') + '\n' +
      '\nCalculated at BuildCalcTools.site';

    navigator.clipboard.writeText(text).then(function () {
      var btn = $('#copyBtn');
      var orig = btn.textContent;
      btn.textContent = '\u2713 Copied!';
      setTimeout(function () { btn.textContent = orig; }, 2500);
    });
  }

  /* ══════════════════════════════════════ */
  /*  10. printResults                     */
  /* ══════════════════════════════════════ */
  function printResults() { window.print(); }

  /* ══════════════════════════════════════ */
  /*  11. initFAQ                          */
  /* ══════════════════════════════════════ */
  function initFAQ() {
    $$('.faq-question').forEach(function (q) {
      q.addEventListener('click', function () {
        var wasOpen = q.classList.contains('open');
        $$('.faq-question').forEach(function (qq) {
          qq.classList.remove('open');
          qq.querySelector('.faq-arrow').textContent = '\u25B8';
        });
        $$('.faq-answer').forEach(function (a) { a.classList.remove('open'); });
        if (!wasOpen) {
          q.classList.add('open');
          q.querySelector('.faq-arrow').textContent = '\u25BE';
          q.nextElementSibling.classList.add('open');
        }
      });
    });
  }

})();
