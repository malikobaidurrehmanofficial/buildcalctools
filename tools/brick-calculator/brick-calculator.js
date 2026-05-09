/* ============================================
   Brick Calculator — Logic
   Pure client-side. No APIs. No localStorage.
   ============================================ */

(function () {
  'use strict';

  /* ── Constants ── */
  const MORTAR_VOLUME_FRACTION = 0.30;
  const CEMENT_DENSITY_KG_M3  = 1500;
  const DRY_VOLUME_FACTOR     = 1.33;
  const FT_TO_M  = 0.3048;
  const IN_TO_M  = 0.0254;
  const MM_TO_M  = 0.001;
  const M2_TO_FT2 = 10.7639;

  const BRICK_DEFAULTS = {
    metric:    { l: 230, h: 76,  w: 110, t: 10,  unit: 'mm' },
    imperial:  { l: 9,   h: 3,   w: 4.5, t: 0.5, unit: 'in' },
    pakistani: { l: 9,   h: 3,   w: 4.5, t: 0.5, unit: 'in' }
  };

  const WASTAGE_HINTS = {
    0:  'Not recommended — allows no margin for breakage',
    5:  'Good for machine-cut bricks on pallets',
    10: 'Recommended for most residential and commercial projects',
    15: 'Use for curved walls, complex patterns or difficult access'
  };

  /* ── State ── */
  let currentUnit    = 'metric';
  let currentWall    = 'single';
  let currentWastage = 10;
  let hasCalculated  = false;

  /* ── DOM Ready ── */
  document.addEventListener('DOMContentLoaded', initPage);

  /* ════════════════════════════════════════
     1. INIT PAGE
     ════════════════════════════════════════ */
  function initPage() {
    setUnit('metric');
    setWallType('single');
    setWastage(10);
    fillBrickDefaults('metric');

    // Unit toggle
    document.querySelectorAll('#unitToggle .unit-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setUnit(btn.dataset.unit); });
    });

    // Wall type cards
    document.querySelectorAll('#wallTypeGrid .wall-type-card').forEach(function (card) {
      card.addEventListener('click', function () { setWallType(card.dataset.wall); });
    });

    // Wastage buttons
    document.querySelectorAll('#wastageGroup .wastage-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setWastage(parseInt(btn.dataset.wastage, 10)); });
    });

    // Wall area live update
    var wl = document.getElementById('wallLength');
    var wh = document.getElementById('wallHeight');
    if (wl) wl.addEventListener('input', updateWallArea);
    if (wh) wh.addEventListener('input', updateWallArea);

    // Collapsible panels
    var bdToggle = document.getElementById('brickDetailsToggle');
    if (bdToggle) bdToggle.addEventListener('click', toggleBrickDetails);

    var ctToggle = document.getElementById('costToggle');
    if (ctToggle) ctToggle.addEventListener('click', toggleCostSection);

    // Calculate button
    var calcBtn = document.getElementById('calcBtn');
    if (calcBtn) calcBtn.addEventListener('click', function () {
      if (validateInputs()) calculateBricks();
    });

    // Copy & Print
    var copyBtn = document.getElementById('copyBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyResults);

    var printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.addEventListener('click', printResults);

    // FAQ
    initFAQAccordion();

    // Live recalculation on all inputs
    initLiveUpdate();
  }

  /* ════════════════════════════════════════
     2. SET UNIT
     ════════════════════════════════════════ */
  function setUnit(unit) {
    currentUnit = unit;

    document.querySelectorAll('#unitToggle .unit-toggle-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.unit === unit);
    });

    var isMetric = (unit === 'metric');
    var lenUnit = isMetric ? 'm' : 'ft';
    var brickUnit = isMetric ? 'mm' : 'in';
    var areaUnit = isMetric ? 'm\u00B2' : 'ft\u00B2';

    // Wall dimension labels
    var ll = document.getElementById('labelWallLength');
    var lh = document.getElementById('labelWallHeight');
    if (ll) ll.textContent = 'Wall Length (' + lenUnit + ')';
    if (lh) lh.textContent = 'Wall Height (' + lenUnit + ')';

    // Brick dimension labels
    var lblL = document.getElementById('labelBrickL');
    var lblH = document.getElementById('labelBrickH');
    var lblW = document.getElementById('labelBrickW');
    var lblM = document.getElementById('labelMortar');
    if (lblL) lblL.textContent = 'Brick Length (' + brickUnit + ')';
    if (lblH) lblH.textContent = 'Brick Height (' + brickUnit + ')';
    if (lblW) lblW.textContent = 'Brick Width (' + brickUnit + ')';
    if (lblM) lblM.textContent = 'Mortar Joint (' + brickUnit + ')';

    // Price label
    var lblP = document.getElementById('labelPrice');
    if (lblP) lblP.textContent = isMetric ? 'Price per Brick (USD)' : 'Price per Brick (PKR)';

    fillBrickDefaults(unit);
    updateBrickHints(unit);
    updateWallArea();

    if (hasCalculated) calculateBricks();
  }

  function fillBrickDefaults(unit) {
    var d = BRICK_DEFAULTS[unit];
    var el;
    el = document.getElementById('brickLength'); if (el) el.value = d.l;
    el = document.getElementById('brickHeight'); if (el) el.value = d.h;
    el = document.getElementById('brickWidth');  if (el) el.value = d.w;
    el = document.getElementById('mortarJoint'); if (el) el.value = d.t;
  }

  function updateBrickHints(unit) {
    var d = BRICK_DEFAULTS[unit];
    var label = unit === 'metric' ? 'standard metric' : (unit === 'pakistani' ? 'Pakistan Awwal class' : 'standard imperial');
    var u = d.unit;
    setHint('hintBrickL', 'Default: ' + d.l + ' ' + u + ' (' + label + ')');
    setHint('hintBrickH', 'Default: ' + d.h + ' ' + u + ' (' + label + ')');
    setHint('hintBrickW', 'Default: ' + d.w + ' ' + u + ' (' + label + ')');
    setHint('hintMortar', 'Default: ' + d.t + ' ' + u + ' (' + label + ')');
  }

  function setHint(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ════════════════════════════════════════
     3. SET WALL TYPE
     ════════════════════════════════════════ */
  function setWallType(type) {
    currentWall = type;
    document.querySelectorAll('#wallTypeGrid .wall-type-card').forEach(function (c) {
      c.classList.toggle('active', c.dataset.wall === type);
    });
    if (hasCalculated) calculateBricks();
  }

  /* ════════════════════════════════════════
     4. SET WASTAGE
     ════════════════════════════════════════ */
  function setWastage(percent) {
    currentWastage = percent;
    document.querySelectorAll('#wastageGroup .wastage-btn').forEach(function (b) {
      b.classList.toggle('active', parseInt(b.dataset.wastage, 10) === percent);
    });
    var hint = document.getElementById('wastageHint');
    if (hint) hint.textContent = WASTAGE_HINTS[percent] || '';
    if (hasCalculated) calculateBricks();
  }

  /* ════════════════════════════════════════
     5. UPDATE WALL AREA
     ════════════════════════════════════════ */
  function updateWallArea() {
    var L = parseFloat(document.getElementById('wallLength').value) || 0;
    var H = parseFloat(document.getElementById('wallHeight').value) || 0;
    var area = L * H;
    var display = document.getElementById('wallAreaDisplay');
    if (display) {
      if (currentUnit === 'metric') {
        display.textContent = area.toFixed(2) + ' m\u00B2';
      } else {
        display.textContent = area.toFixed(2) + ' ft\u00B2';
      }
    }
  }

  /* ════════════════════════════════════════
     6. TOGGLE BRICK DETAILS
     ════════════════════════════════════════ */
  function toggleBrickDetails() {
    var panel = document.getElementById('brickDetailsPanel');
    var toggle = document.getElementById('brickDetailsToggle');
    if (!panel || !toggle) return;
    var isOpen = panel.classList.contains('open');
    panel.classList.toggle('open');
    toggle.classList.toggle('open');
    var arrow = toggle.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
    toggle.childNodes[toggle.childNodes.length - 1].textContent = isOpen ? ' Customise Brick Size' : ' Customise Brick Size';
  }

  /* ════════════════════════════════════════
     7. TOGGLE COST SECTION
     ════════════════════════════════════════ */
  function toggleCostSection() {
    var panel = document.getElementById('costPanel');
    var toggle = document.getElementById('costToggle');
    if (!panel || !toggle) return;
    var isOpen = panel.classList.contains('open');
    panel.classList.toggle('open');
    var arrow = toggle.querySelector('.toggle-arrow');
    if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
  }

  /* ════════════════════════════════════════
     8. VALIDATE INPUTS
     ════════════════════════════════════════ */
  function validateInputs() {
    clearErrors();
    var valid = true;

    valid = checkField('wallLength', 'errWallLength') && valid;
    valid = checkField('wallHeight', 'errWallHeight') && valid;
    valid = checkField('brickLength', 'errBrickL') && valid;
    valid = checkField('brickHeight', 'errBrickH') && valid;

    return valid;
  }

  function checkField(inputId, errorId) {
    var input = document.getElementById(inputId);
    var error = document.getElementById(errorId);
    if (!input) return true;
    var val = parseFloat(input.value);
    if (isNaN(val) || val <= 0) {
      input.classList.add('input-error');
      if (error) error.classList.add('visible');
      return false;
    }
    return true;
  }

  function clearErrors() {
    document.querySelectorAll('.input-error').forEach(function (el) {
      el.classList.remove('input-error');
    });
    document.querySelectorAll('.field-error-msg.visible').forEach(function (el) {
      el.classList.remove('visible');
    });
  }

  /* ════════════════════════════════════════
     9. CALCULATE BRICKS
     ════════════════════════════════════════ */
  function calculateBricks() {
    var isMetric = (currentUnit === 'metric');

    // Read wall dimensions (in user units) and convert to metres
    var wallLength = parseFloat(document.getElementById('wallLength').value) || 0;
    var wallHeight = parseFloat(document.getElementById('wallHeight').value) || 0;
    if (!isMetric) {
      wallLength *= FT_TO_M;
      wallHeight *= FT_TO_M;
    }

    // Read brick dimensions and convert to metres
    var bL = parseFloat(document.getElementById('brickLength').value) || 0;
    var bH = parseFloat(document.getElementById('brickHeight').value) || 0;
    var bW = parseFloat(document.getElementById('brickWidth').value) || 0;
    var bT = parseFloat(document.getElementById('mortarJoint').value) || 0;

    if (isMetric) {
      bL *= MM_TO_M; bH *= MM_TO_M; bW *= MM_TO_M; bT *= MM_TO_M;
    } else {
      bL *= IN_TO_M; bH *= IN_TO_M; bW *= IN_TO_M; bT *= IN_TO_M;
    }

    // Wall type multiplier
    var wallMultiplier = (currentWall === 'double') ? 2 : 1;

    // Wastage
    var wastage = currentWastage / 100;

    // Mix ratio
    var mixStr = document.getElementById('mixRatio').value;
    var mixParts = mixStr.split(':');
    var cementRatio = parseInt(mixParts[0], 10);
    var sandRatio = parseInt(mixParts[1], 10);
    var totalRatio = cementRatio + sandRatio;

    // === Calculations ===
    var wallArea = wallLength * wallHeight;
    var brickFaceArea = (bL + bT) * (bH + bT);
    var bricksNet = (brickFaceArea > 0) ? wallArea / brickFaceArea : 0;
    bricksNet *= wallMultiplier;
    var bricksWithWastage = Math.ceil(bricksNet * (1 + wastage));

    var wallThickness = bW * wallMultiplier;
    var wallVolume = wallArea * wallThickness;
    var mortarVolume = wallVolume * MORTAR_VOLUME_FRACTION;
    var mortarVolumeDry = mortarVolume * DRY_VOLUME_FACTOR;

    var cementVolume = mortarVolumeDry * (cementRatio / totalRatio);
    var cementWeight = cementVolume * CEMENT_DENSITY_KG_M3;
    var cementBags50 = Math.ceil(cementWeight / 50);

    var sandVolume = mortarVolumeDry * (sandRatio / totalRatio);

    // Cost
    var priceInput = parseFloat(document.getElementById('pricePerBrick').value) || 0;
    var totalCost = (priceInput > 0) ? bricksWithWastage * priceInput : 0;

    // === Populate Results ===
    setText('resBricksNet', Math.ceil(bricksNet).toLocaleString() + ' bricks');
    setText('resBricksTotal', bricksWithWastage.toLocaleString() + ' bricks');
    setText('resBricksTotalSub', 'Including ' + currentWastage + '% wastage');

    if (isMetric) {
      setText('resMortar', mortarVolume.toFixed(2) + ' m\u00B3');
      setText('resSand', sandVolume.toFixed(2) + ' m\u00B3');
      setText('resArea', wallArea.toFixed(2) + ' m\u00B2');
    } else {
      var mortarFt3 = mortarVolume * 35.3147;
      var sandFt3 = sandVolume * 35.3147;
      var areaFt2 = wallArea * M2_TO_FT2;
      setText('resMortar', mortarFt3.toFixed(2) + ' ft\u00B3');
      setText('resSand', sandFt3.toFixed(2) + ' ft\u00B3');
      setText('resArea', areaFt2.toFixed(2) + ' ft\u00B2');
    }

    setText('resCement', cementWeight.toFixed(1) + ' kg');
    setText('resCementSub', cementBags50 + ' bags of 50 kg');

    // Cost card
    var costCard = document.getElementById('costCard');
    if (costCard) {
      if (priceInput > 0) {
        costCard.classList.remove('hidden');
        var currency = isMetric ? 'USD' : 'PKR';
        setText('resCost', currency + ' ' + totalCost.toLocaleString());
        setText('resCostSub', 'Based on ' + priceInput + ' per brick \u00D7 ' + bricksWithWastage.toLocaleString() + ' bricks');
      } else {
        costCard.classList.add('hidden');
      }
    }

    // Disclaimer
    setText('resultsDisclaimer',
      'This estimate is for guidance only. Wall area does not deduct for openings (doors, windows). Measure and deduct these separately. Mortar volume calculated at 30% of wall volume using ' + mixStr + ' mix ratio. Always consult a qualified mason or structural engineer before ordering materials.');

    // Show results
    var resultsBox = document.getElementById('resultsBox');
    resultsBox.classList.add('visible');
    hasCalculated = true;

    // Smooth scroll
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* ════════════════════════════════════════
     10. COPY RESULTS
     ════════════════════════════════════════ */
  function copyResults() {
    var isMetric = (currentUnit === 'metric');
    var wL = document.getElementById('wallLength').value || '0';
    var wH = document.getElementById('wallHeight').value || '0';
    var lenUnit = isMetric ? 'm' : 'ft';
    var areaText = document.getElementById('resArea').textContent;

    var text = [
      'BRICK CALCULATOR RESULTS \u2014 BuildCalcTools.site',
      '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
      'Wall: ' + wL + lenUnit + ' \u00D7 ' + wH + lenUnit + ' = ' + areaText,
      'Wall Type: ' + (currentWall === 'double' ? 'Double' : 'Single') + ' Brick',
      'Wastage: ' + currentWastage + '%',
      '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
      'Bricks Required (net):   ' + document.getElementById('resBricksNet').textContent,
      'Total Bricks to Order:   ' + document.getElementById('resBricksTotal').textContent,
      'Mortar Volume:           ' + document.getElementById('resMortar').textContent,
      'Cement Required:         ' + document.getElementById('resCement').textContent + ' (' + document.getElementById('resCementSub').textContent + ')',
      'Sand Required:           ' + document.getElementById('resSand').textContent,
      '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500',
      'Calculated by BuildCalcTools.site'
    ].join('\n');

    navigator.clipboard.writeText(text).then(function () {
      showCopyFeedback();
    }).catch(function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopyFeedback();
    });
  }

  function showCopyFeedback() {
    var btn = document.getElementById('copyBtn');
    var feedback = document.getElementById('copyFeedback');
    if (feedback) {
      feedback.classList.add('show');
      setTimeout(function () { feedback.classList.remove('show'); }, 2500);
    }
  }

  /* ════════════════════════════════════════
     11. PRINT RESULTS
     ════════════════════════════════════════ */
  function printResults() {
    window.print();
  }

  /* ════════════════════════════════════════
     12. FAQ ACCORDION
     ════════════════════════════════════════ */
  function initFAQAccordion() {
    document.querySelectorAll('.faq-question').forEach(function (q) {
      q.addEventListener('click', function () {
        var answer = q.nextElementSibling;
        var isOpen = q.classList.contains('active');
        var arrow = q.querySelector('.faq-arrow');

        // Close all
        document.querySelectorAll('.faq-question').forEach(function (oq) {
          oq.classList.remove('active');
          if (oq.nextElementSibling) oq.nextElementSibling.classList.remove('visible');
          var oa = oq.querySelector('.faq-arrow');
          if (oa) oa.textContent = '\u25B8';
        });

        // Toggle clicked
        if (!isOpen) {
          q.classList.add('active');
          if (answer) answer.classList.add('visible');
          if (arrow) arrow.textContent = '\u25BE';
        }
      });
    });
  }

  /* ════════════════════════════════════════
     13. LIVE RECALCULATION
     ════════════════════════════════════════ */
  function initLiveUpdate() {
    var inputs = document.querySelectorAll('#calculatorSection input, #calculatorSection select');
    inputs.forEach(function (el) {
      el.addEventListener('input', function () {
        if (hasCalculated) {
          clearErrors();
          if (validateInputs()) calculateBricks();
        }
      });
    });
  }

})();
