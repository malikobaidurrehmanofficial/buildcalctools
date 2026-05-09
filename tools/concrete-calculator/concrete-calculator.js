/* ============================================
   Concrete Calculator — Logic
   Pure client-side. No APIs. No localStorage.
   ============================================ */

(function () {
  'use strict';

  /* ── State ── */
  let currentUnit = 'metric';   // 'metric' | 'imperial'
  let currentTab  = 'slab';     // 'slab' | 'round' | 'tube' | 'curb' | 'stairs'
  let hasCalculated = false;

  /* ── Constants ── */
  const CONCRETE_DENSITY = 2400; // kg per m³
  const M3_TO_YD3 = 1.30795;
  const M3_TO_FT3 = 35.3147;
  const M3_TO_LITRES = 1000;
  const FT_TO_M = 0.3048;
  const IN_TO_M = 0.0254;
  const CM_TO_M = 0.01;

  /* ── DOM Ready ── */
  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initUnitToggle();
    initCalculateButton();
    initCopyButton();
    initPrintButton();
    initFAQAccordion();
    initLiveUpdate();
  });

  /* ════════════════════════════════════════
     1. UNIT TOGGLE
     ════════════════════════════════════════ */
  function initUnitToggle() {
    document.querySelectorAll('.unit-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchUnit(btn.dataset.unit);
      });
    });
  }

  function switchUnit(unit) {
    if (unit === currentUnit) return;
    currentUnit = unit;

    // Update toggle buttons
    document.querySelectorAll('.unit-toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.unit === unit);
    });

    // Update all labels
    const isMetric = unit === 'metric';
    document.querySelectorAll('[data-label-metric]').forEach(el => {
      el.textContent = isMetric ? el.dataset.labelMetric : el.dataset.labelImperial;
    });

    // Update hint texts
    document.querySelectorAll('[data-hint-metric]').forEach(el => {
      el.textContent = isMetric ? el.dataset.hintMetric : el.dataset.hintImperial;
    });

    // Recalculate if results are visible
    if (hasCalculated) {
      calculateConcrete();
    }
  }

  /* ════════════════════════════════════════
     2. SHAPE TABS
     ════════════════════════════════════════ */
  function initTabs() {
    document.querySelectorAll('.shape-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        switchTab(tab.dataset.tab);
      });
    });
  }

  function switchTab(tabId) {
    currentTab = tabId;

    // Update tab buttons
    document.querySelectorAll('.shape-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });

    // Show correct panel
    document.querySelectorAll('.input-panel').forEach(p => {
      p.classList.toggle('active', p.id === 'panel-' + tabId);
    });

    // Clear validation errors
    clearValidationErrors();
  }

  /* ════════════════════════════════════════
     3. INPUT VALIDATION
     ════════════════════════════════════════ */
  function validateInputs() {
    clearValidationErrors();
    const panel = document.getElementById('panel-' + currentTab);
    if (!panel) return false;

    const inputs = panel.querySelectorAll('input[required], select[required]');
    let valid = true;

    inputs.forEach(input => {
      const val = parseFloat(input.value);
      if (isNaN(val) || val <= 0) {
        input.classList.add('input-error');
        const errorEl = input.parentElement.querySelector('.field-error');
        if (errorEl) {
          errorEl.textContent = 'Please enter a value greater than 0';
          errorEl.classList.add('visible');
        }
        valid = false;
      }
    });

    // Special validation for tube: inner < outer
    if (currentTab === 'tube') {
      const outer = parseFloat(document.getElementById('tube-outer-dia').value) || 0;
      const inner = parseFloat(document.getElementById('tube-inner-dia').value) || 0;
      if (inner >= outer && outer > 0 && inner > 0) {
        const innerInput = document.getElementById('tube-inner-dia');
        innerInput.classList.add('input-error');
        const errorEl = innerInput.parentElement.querySelector('.field-error');
        if (errorEl) {
          errorEl.textContent = 'Inner diameter must be less than outer diameter';
          errorEl.classList.add('visible');
        }
        valid = false;
      }
    }

    return valid;
  }

  function clearValidationErrors() {
    document.querySelectorAll('.input-error').forEach(el => {
      el.classList.remove('input-error');
    });
    document.querySelectorAll('.field-error.visible').forEach(el => {
      el.classList.remove('visible');
    });
  }

  /* ════════════════════════════════════════
     4. CALCULATE
     ════════════════════════════════════════ */
  function initCalculateButton() {
    const btn = document.getElementById('calcBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (validateInputs()) {
          calculateConcrete();
        }
      });
    }
  }

  function getVal(id) {
    return parseFloat(document.getElementById(id).value) || 0;
  }

  function toMetres(val, type) {
    if (currentUnit === 'metric') {
      return type === 'cm' ? val * CM_TO_M : val;
    } else {
      return type === 'in' ? val * IN_TO_M : val * FT_TO_M;
    }
  }

  function calculateConcrete() {
    let volumeM3 = 0;

    switch (currentTab) {
      case 'slab': {
        const length = toMetres(getVal('slab-length'), 'm');
        const width  = toMetres(getVal('slab-width'), 'm');
        const thick  = toMetres(getVal('slab-thickness'), 'cm');
        const qty    = Math.max(1, Math.floor(getVal('slab-qty') || 1));
        volumeM3 = length * width * thick * qty;
        break;
      }
      case 'round': {
        const dia    = toMetres(getVal('round-dia'), 'm');
        const height = toMetres(getVal('round-height'), 'm');
        const qty    = Math.max(1, Math.floor(getVal('round-qty') || 1));
        const radius = dia / 2;
        volumeM3 = Math.PI * radius * radius * height * qty;
        break;
      }
      case 'tube': {
        const outerDia = toMetres(getVal('tube-outer-dia'), 'm');
        const innerDia = toMetres(getVal('tube-inner-dia'), 'm');
        const height   = toMetres(getVal('tube-height'), 'm');
        const qty      = Math.max(1, Math.floor(getVal('tube-qty') || 1));
        const outerR = outerDia / 2;
        const innerR = innerDia / 2;
        volumeM3 = Math.PI * height * (outerR * outerR - innerR * innerR) * qty;
        break;
      }
      case 'curb': {
        const curbDepth   = toMetres(getVal('curb-depth'), 'cm');
        const gutterWidth = toMetres(getVal('curb-gutter-width'), 'cm');
        const curbHeight  = toMetres(getVal('curb-height'), 'cm');
        const flagThick   = toMetres(getVal('curb-flag-thick'), 'cm');
        const length      = toMetres(getVal('curb-length'), 'm');
        const qty         = Math.max(1, Math.floor(getVal('curb-qty') || 1));
        // Curb cross-section: curb rectangle + gutter/flag rectangle
        const curbArea = (curbDepth * curbHeight) + (gutterWidth * flagThick);
        volumeM3 = curbArea * length * qty;
        break;
      }
      case 'stairs': {
        const run         = toMetres(getVal('stair-run'), 'cm');
        const rise        = toMetres(getVal('stair-rise'), 'cm');
        const width       = toMetres(getVal('stair-width'), 'm');
        const platformD   = toMetres(getVal('stair-platform'), 'm');
        const steps       = Math.max(1, Math.floor(getVal('stair-steps') || 1));
        // Triangular prism approximation per step + platform slab
        const stairVol = 0.5 * rise * run * width * steps;
        // Platform as rectangle: width * platformDepth * rise (one step height)
        const platformVol = width * platformD * rise;
        volumeM3 = stairVol + platformVol;
        break;
      }
    }

    // Apply wastage
    const wastageSelect = document.getElementById('wastage');
    const wastagePercent = parseFloat(wastageSelect.value) || 10;
    const wastageMultiplier = 1 + (wastagePercent / 100);
    volumeM3 *= wastageMultiplier;

    // Prevent negative or zero
    if (volumeM3 <= 0) {
      volumeM3 = 0;
    }

    // Convert
    const volumeYd3   = volumeM3 * M3_TO_YD3;
    const volumeFt3   = volumeM3 * M3_TO_FT3;
    const volumeL     = volumeM3 * M3_TO_LITRES;
    const weightKg    = volumeM3 * CONCRETE_DENSITY;
    const weightTonnes = weightKg / 1000;
    const bags20      = Math.ceil(weightKg / 20);
    const bags25      = Math.ceil(weightKg / 25);
    const bags40      = Math.ceil(weightKg / 40);

    // Populate results
    const isMetric = currentUnit === 'metric';

    document.getElementById('res-primary-label').textContent = isMetric ? 'Volume' : 'Volume';
    document.getElementById('res-primary-value').textContent = isMetric
      ? volumeM3.toFixed(2)
      : volumeYd3.toFixed(2);
    document.getElementById('res-primary-unit').textContent = isMetric ? 'm³' : 'yd³';

    document.getElementById('res-ft3-value').textContent = volumeFt3.toFixed(2);
    document.getElementById('res-litres-value').textContent = volumeL.toFixed(0);
    document.getElementById('res-kg-value').textContent = numberWithCommas(weightKg.toFixed(0));
    document.getElementById('res-tonnes-value').textContent = weightTonnes.toFixed(2);

    document.getElementById('res-bags20').textContent = bags20;
    document.getElementById('res-bags25').textContent = bags25;
    document.getElementById('res-bags40').textContent = bags40;

    // Update note
    document.getElementById('results-note-text').textContent =
      'Results include ' + wastagePercent + '% wastage. Density assumed: 2,400 kg/m\u00B3 (standard reinforced concrete). Always purchase a small buffer above the calculated amount.';

    // Show results
    const resultsBox = document.getElementById('resultsBox');
    resultsBox.classList.add('visible');
    hasCalculated = true;

    // Smooth scroll
    resultsBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* ════════════════════════════════════════
     5. COPY RESULTS
     ════════════════════════════════════════ */
  function initCopyButton() {
    const btn = document.getElementById('copyBtn');
    if (btn) {
      btn.addEventListener('click', copyResults);
    }
  }

  function copyResults() {
    const isMetric = currentUnit === 'metric';
    const primary = document.getElementById('res-primary-value').textContent;
    const pUnit   = document.getElementById('res-primary-unit').textContent;
    const ft3     = document.getElementById('res-ft3-value').textContent;
    const litres  = document.getElementById('res-litres-value').textContent;
    const kg      = document.getElementById('res-kg-value').textContent;
    const tonnes  = document.getElementById('res-tonnes-value').textContent;
    const b20     = document.getElementById('res-bags20').textContent;
    const b25     = document.getElementById('res-bags25').textContent;
    const b40     = document.getElementById('res-bags40').textContent;

    const text = [
      'Concrete Volume Calculator — BuildCalcTools.site',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'Volume: ' + primary + ' ' + pUnit,
      'Volume (ft³): ' + ft3,
      'Volume (litres): ' + litres,
      'Weight: ' + kg + ' kg (' + tonnes + ' tonnes)',
      'Bags needed: ' + b20 + ' × 20 kg | ' + b25 + ' × 25 kg | ' + b40 + ' × 40 kg',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'Calculated at buildcalctools.site'
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      const feedback = document.getElementById('copyFeedback');
      if (feedback) {
        feedback.classList.add('show');
        setTimeout(() => feedback.classList.remove('show'), 2000);
      }
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      const feedback = document.getElementById('copyFeedback');
      if (feedback) {
        feedback.classList.add('show');
        setTimeout(() => feedback.classList.remove('show'), 2000);
      }
    });
  }

  /* ════════════════════════════════════════
     6. PRINT
     ════════════════════════════════════════ */
  function initPrintButton() {
    const btn = document.getElementById('printBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  /* ════════════════════════════════════════
     7. FAQ ACCORDION
     ════════════════════════════════════════ */
  function initFAQAccordion() {
    document.querySelectorAll('.faq-question').forEach(q => {
      q.addEventListener('click', () => {
        const answer = q.nextElementSibling;
        const isOpen = q.classList.contains('active');

        // Close all
        document.querySelectorAll('.faq-question').forEach(oq => {
          oq.classList.remove('active');
          oq.nextElementSibling.classList.remove('visible');
        });

        // Open clicked if it was closed
        if (!isOpen) {
          q.classList.add('active');
          answer.classList.add('visible');
        }
      });
    });
  }

  /* ════════════════════════════════════════
     8. LIVE UPDATE
     ════════════════════════════════════════ */
  function initLiveUpdate() {
    document.querySelectorAll('.input-panel input, .input-panel select, #wastage').forEach(el => {
      el.addEventListener('input', () => {
        if (hasCalculated) {
          clearValidationErrors();
          calculateConcrete();
        }
      });
    });
  }

})();
