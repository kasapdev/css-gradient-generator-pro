/* =====================================================================
   CSS Gradient Generator Pro — app.js
   Visual builder for linear / radial / conic CSS gradients with
   draggable color stops, live preview and copy-ready CSS output.
   Classic script (no modules). Depends on window.WUS (core.js).
   ===================================================================== */
(function () {
  'use strict';

  var WUS = window.WUS;
  var STORE_KEY = 'gradientgen.state';

  /* ----------------------------- DOM refs ---------------------------- */
  var modeLinearBtn = document.getElementById('modeLinear');
  var modeRadialBtn = document.getElementById('modeRadial');
  var modeConicBtn  = document.getElementById('modeConic');

  var btnRandomize = document.getElementById('btnRandomize');
  var btnReset     = document.getElementById('btnReset');

  var previewEl   = document.getElementById('preview');
  var cssOutputEl = document.getElementById('cssOutput');
  var btnCopyCss  = document.getElementById('btnCopyCss');

  var linearControls = document.getElementById('linearControls');
  var angleRange      = document.getElementById('angleRange');
  var angleNumber     = document.getElementById('angleNumber');
  var angleValueLabel = document.getElementById('angleValueLabel');

  var radialControls = document.getElementById('radialControls');
  var shapeCircleBtn  = document.getElementById('shapeCircle');
  var shapeEllipseBtn = document.getElementById('shapeEllipse');
  var radialPosGridEl = document.getElementById('radialPosGrid');
  var radialXEl = document.getElementById('radialX');
  var radialYEl = document.getElementById('radialY');
  var radialXLabel = document.getElementById('radialXLabel');
  var radialYLabel = document.getElementById('radialYLabel');

  var conicControls = document.getElementById('conicControls');
  var conicAngleRange      = document.getElementById('conicAngleRange');
  var conicAngleNumber     = document.getElementById('conicAngleNumber');
  var conicAngleValueLabel = document.getElementById('conicAngleValueLabel');
  var conicPosGridEl = document.getElementById('conicPosGrid');
  var conicXEl = document.getElementById('conicX');
  var conicYEl = document.getElementById('conicY');
  var conicXLabel = document.getElementById('conicXLabel');
  var conicYLabel = document.getElementById('conicYLabel');

  var presetRowEl = document.getElementById('presetRow');
  var btnAddStop  = document.getElementById('btnAddStop');
  var stopListEl  = document.getElementById('stopList');

  /* ----------------------------- State -------------------------------
     stops[]: array order = editing/list order (drag-reorderable).
     Gradient CSS is always generated from stops sorted by pos ascending.
     ------------------------------------------------------------------- */
  var state = null;
  var draggedStopId = null;

  function defaultState() {
    return {
      mode: 'linear',
      angle: 135,
      shape: 'circle',
      radialX: 50, radialY: 50,
      conicAngle: 0,
      conicX: 50, conicY: 50,
      stops: [
        { id: WUS.uid(), color: '#6366f1', pos: 0 },
        { id: WUS.uid(), color: '#8b5cf6', pos: 50 },
        { id: WUS.uid(), color: '#d946ef', pos: 100 }
      ]
    };
  }

  /* =================================================================
     COLOR HELPERS
     ================================================================= */
  function hexToRgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var num = parseInt(h, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      v = WUS.clamp(Math.round(v), 0, 255);
      var s = v.toString(16);
      return s.length === 1 ? '0' + s : s;
    }).join('');
  }
  function interpolateColor(hex1, hex2, t) {
    var c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
    return rgbToHex(c1.r + (c2.r - c1.r) * t, c1.g + (c2.g - c1.g) * t, c1.b + (c2.b - c1.b) * t);
  }
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2;
    var r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }
  function normalizeHex(v) {
    v = String(v || '').trim();
    if (v[0] !== '#') v = '#' + v;
    if (/^#[0-9a-fA-F]{3}$/.test(v)) {
      v = '#' + v.slice(1).split('').map(function (c) { return c + c; }).join('');
    }
    if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
    return null;
  }

  /* =================================================================
     FORMATTING
     ================================================================= */
  function fmtPct(n) {
    var r = Math.round(Number(n) * 100) / 100;
    var s = r.toFixed(2).replace(/\.?0+$/, '');
    return s + '%';
  }
  function clampNum(v, fallback, min, max) {
    v = Number(v);
    if (isNaN(v)) v = fallback;
    return WUS.clamp(v, min, max);
  }

  /* =================================================================
     GRADIENT CSS GENERATION
     ================================================================= */
  function sortedStops() {
    return state.stops.slice().sort(function (a, b) { return a.pos - b.pos; });
  }
  function stopsCss() {
    return sortedStops().map(function (s) { return s.color + ' ' + fmtPct(s.pos); }).join(', ');
  }
  function buildGradientCss() {
    var stopsStr = stopsCss();
    if (state.mode === 'radial') {
      return 'radial-gradient(' + state.shape + ' at ' + fmtPct(state.radialX) + ' ' + fmtPct(state.radialY) + ', ' + stopsStr + ')';
    }
    if (state.mode === 'conic') {
      return 'conic-gradient(from ' + Math.round(state.conicAngle) + 'deg at ' + fmtPct(state.conicX) + ' ' + fmtPct(state.conicY) + ', ' + stopsStr + ')';
    }
    return 'linear-gradient(' + Math.round(state.angle) + 'deg, ' + stopsStr + ')';
  }

  function updateOutputs() {
    var css = buildGradientCss();
    previewEl.style.background = css;
    cssOutputEl.textContent = 'background: ' + css + ';';
  }

  /* =================================================================
     PRESETS
     ================================================================= */
  var PRESETS = [
    { name: 'Purple Haze', mode: 'linear', angle: 135, stops: [{ color: '#6366f1', pos: 0 }, { color: '#8b5cf6', pos: 50 }, { color: '#d946ef', pos: 100 }] },
    { name: 'Sunset', mode: 'linear', angle: 120, stops: [{ color: '#ff512f', pos: 0 }, { color: '#f09819', pos: 100 }] },
    { name: 'Ocean', mode: 'linear', angle: 135, stops: [{ color: '#2193b0', pos: 0 }, { color: '#6dd5ed', pos: 100 }] },
    { name: 'Mint', mode: 'linear', angle: 120, stops: [{ color: '#00b09b', pos: 0 }, { color: '#96c93d', pos: 100 }] },
    { name: 'Fire', mode: 'linear', angle: 45, stops: [{ color: '#f83600', pos: 0 }, { color: '#f9d423', pos: 100 }] },
    { name: 'Cool Blues', mode: 'linear', angle: 160, stops: [{ color: '#2980b9', pos: 0 }, { color: '#6dd5fa', pos: 100 }] },
    { name: 'Peachy', mode: 'linear', angle: 100, stops: [{ color: '#ffecd2', pos: 0 }, { color: '#fcb69f', pos: 100 }] },
    { name: 'Emerald Pool', mode: 'radial', shape: 'circle', x: 50, y: 50, stops: [{ color: '#348f50', pos: 0 }, { color: '#56b4d3', pos: 100 }] },
    { name: 'Berry', mode: 'linear', angle: 200, stops: [{ color: '#c31432', pos: 0 }, { color: '#240b36', pos: 100 }] },
    { name: 'Candy Swirl', mode: 'conic', angle: 90, x: 50, y: 50, stops: [{ color: '#ff9a9e', pos: 0 }, { color: '#fecfef', pos: 50 }, { color: '#a18cd1', pos: 100 }] }
  ];

  function presetCssString(preset) {
    var stopsStr = preset.stops.map(function (s) { return s.color + ' ' + s.pos + '%'; }).join(', ');
    if (preset.mode === 'radial') return 'radial-gradient(' + preset.shape + ' at ' + preset.x + '% ' + preset.y + '%, ' + stopsStr + ')';
    if (preset.mode === 'conic') return 'conic-gradient(from ' + preset.angle + 'deg at ' + preset.x + '% ' + preset.y + '%, ' + stopsStr + ')';
    return 'linear-gradient(' + preset.angle + 'deg, ' + stopsStr + ')';
  }

  function renderPresets() {
    presetRowEl.innerHTML = '';
    PRESETS.forEach(function (preset) {
      var btn = WUS.el('button', {
        type: 'button', class: 'preset-swatch',
        style: 'background:' + presetCssString(preset),
        title: preset.name, 'aria-label': 'Load preset: ' + preset.name
      });
      btn.addEventListener('click', function () { loadPreset(preset); });
      presetRowEl.appendChild(btn);
    });
  }

  function loadPreset(preset) {
    state.mode = preset.mode;
    state.stops = preset.stops.map(function (s) { return { id: WUS.uid(), color: s.color, pos: s.pos }; });
    if (preset.mode === 'linear') {
      state.angle = preset.angle;
    } else if (preset.mode === 'radial') {
      state.shape = preset.shape;
      state.radialX = preset.x;
      state.radialY = preset.y;
    } else if (preset.mode === 'conic') {
      state.conicAngle = preset.angle;
      state.conicX = preset.x;
      state.conicY = preset.y;
    }
    syncControlsFromState();
    setMode(state.mode);
    renderStops();
    WUS.toast('Preset loaded: ' + preset.name);
    persist();
  }

  /* =================================================================
     POSITION PRESET GRID (radial / conic center)
     ================================================================= */
  var POS_PRESETS = [
    { x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 },
    { x: 0, y: 50 }, { x: 50, y: 50 }, { x: 100, y: 50 },
    { x: 0, y: 100 }, { x: 50, y: 100 }, { x: 100, y: 100 }
  ];
  function buildPosGrid(container, onPick) {
    container.innerHTML = '';
    POS_PRESETS.forEach(function (p) {
      var btn = WUS.el('button', {
        type: 'button', 'data-x': String(p.x), 'data-y': String(p.y),
        title: p.x + '%, ' + p.y + '%', 'aria-label': 'Set center to ' + p.x + '%, ' + p.y + '%'
      }, [WUS.el('span', { class: 'dot' })]);
      btn.addEventListener('click', function () { onPick(p.x, p.y); });
      container.appendChild(btn);
    });
  }
  function updatePosGridActive(container, x, y) {
    var btns = container.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var isActive = Number(btns[i].getAttribute('data-x')) === x && Number(btns[i].getAttribute('data-y')) === y;
      btns[i].classList.toggle('is-active', isActive);
    }
  }

  function handleRadialPosPick(x, y) {
    state.radialX = x; state.radialY = y;
    radialXEl.value = String(x); radialYEl.value = String(y);
    radialXLabel.textContent = x + '%'; radialYLabel.textContent = y + '%';
    updatePosGridActive(radialPosGridEl, x, y);
    updateOutputs();
    persist();
  }
  function handleConicPosPick(x, y) {
    state.conicX = x; state.conicY = y;
    conicXEl.value = String(x); conicYEl.value = String(y);
    conicXLabel.textContent = x + '%'; conicYLabel.textContent = y + '%';
    updatePosGridActive(conicPosGridEl, x, y);
    updateOutputs();
    persist();
  }

  /* =================================================================
     ICONS
     ================================================================= */
  function svgFromMarkup(markup) {
    var span = document.createElement('span');
    span.innerHTML = markup;
    return span.firstChild;
  }
  function iconGrip() {
    return svgFromMarkup('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="15" cy="18" r="1.2"/></svg>');
  }
  function iconTrash() {
    return svgFromMarkup('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>');
  }

  /* =================================================================
     COLOR STOPS — render, add, remove, drag-reorder
     ================================================================= */
  function buildStopRow(stop) {
    var row = WUS.el('div', { class: 'stop-row', draggable: 'true', 'data-id': stop.id });

    var handle = WUS.el('span', {
      class: 'stop-drag-handle', tabindex: '0', role: 'button',
      title: 'Drag to reorder, or use Arrow Up/Down',
      'aria-label': 'Reorder stop. Press Arrow Up or Arrow Down to move it in the list.'
    }, [iconGrip()]);
    handle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') { e.preventDefault(); moveStop(stop.id, -1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); moveStop(stop.id, 1); }
    });

    var colorInput = WUS.el('input', { type: 'color', class: 'stop-color-input', value: stop.color, 'aria-label': 'Stop color picker' });
    var hexInput = WUS.el('input', { type: 'text', class: 'stop-hex-input mono', value: stop.color, maxlength: '7', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Stop color hex value' });
    var posSlider = WUS.el('input', { type: 'range', class: 'stop-pos-slider', min: '0', max: '100', step: '1', value: String(Math.round(stop.pos)), 'aria-label': 'Stop position percent' });
    var posLabel = WUS.el('span', { class: 'stop-pos-label mono muted', text: fmtPct(stop.pos) });
    var removeBtn = WUS.el('button', { type: 'button', class: 'btn btn--icon btn--ghost btn--sm stop-remove-btn', title: 'Remove stop', 'aria-label': 'Remove stop' }, [iconTrash()]);

    colorInput.addEventListener('input', function () {
      stop.color = colorInput.value;
      hexInput.value = colorInput.value;
      updateOutputs();
      persistDebounced();
    });

    function commitHex() {
      var norm = normalizeHex(hexInput.value);
      if (!norm) {
        hexInput.value = stop.color;
        WUS.toast('Invalid hex color', 'error');
        return;
      }
      stop.color = norm;
      colorInput.value = norm;
      hexInput.value = norm;
      updateOutputs();
      persist();
    }
    hexInput.addEventListener('change', commitHex);
    hexInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); commitHex(); hexInput.blur(); }
    });

    posSlider.addEventListener('input', function () {
      stop.pos = Number(posSlider.value);
      posLabel.textContent = fmtPct(stop.pos);
      updateOutputs();
      persistDebounced();
    });

    removeBtn.addEventListener('click', function () { removeStop(stop.id); });

    row.appendChild(handle);
    row.appendChild(colorInput);
    row.appendChild(hexInput);
    row.appendChild(posSlider);
    row.appendChild(posLabel);
    row.appendChild(removeBtn);

    /* ---- Drag and drop reordering ---- */
    row.addEventListener('dragstart', function (e) {
      if (!e.target.closest('.stop-drag-handle')) { e.preventDefault(); return; }
      draggedStopId = stop.id;
      row.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', stop.id); } catch (err) { /* noop */ }
    });
    row.addEventListener('dragend', function () {
      row.classList.remove('is-dragging');
      var rows = stopListEl.querySelectorAll('.stop-row');
      for (var i = 0; i < rows.length; i++) rows[i].classList.remove('is-drop-target');
      draggedStopId = null;
    });
    row.addEventListener('dragover', function (e) {
      if (!draggedStopId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      row.classList.add('is-drop-target');
    });
    row.addEventListener('dragleave', function () {
      row.classList.remove('is-drop-target');
    });
    row.addEventListener('drop', function (e) {
      e.preventDefault();
      row.classList.remove('is-drop-target');
      if (!draggedStopId || draggedStopId === stop.id) return;
      reorderStops(draggedStopId, stop.id);
    });

    return row;
  }

  function renderStops() {
    stopListEl.innerHTML = '';
    state.stops.forEach(function (stop) {
      stopListEl.appendChild(buildStopRow(stop));
    });
    updateRemoveButtonsState();
    updateOutputs();
  }

  function updateRemoveButtonsState() {
    var disable = state.stops.length <= 2;
    var btns = stopListEl.querySelectorAll('.stop-remove-btn');
    for (var i = 0; i < btns.length; i++) btns[i].disabled = disable;
  }

  function addStop() {
    var sorted = sortedStops();
    var stop;
    if (sorted.length < 2) {
      stop = { id: WUS.uid(), color: '#ffffff', pos: 50 };
    } else {
      var bestGap = -1, bestIdx = 0;
      for (var i = 0; i < sorted.length - 1; i++) {
        var gap = sorted[i + 1].pos - sorted[i].pos;
        if (gap > bestGap) { bestGap = gap; bestIdx = i; }
      }
      var a = sorted[bestIdx], b = sorted[bestIdx + 1];
      var pos = Math.round((a.pos + bestGap / 2) * 10) / 10;
      var color = interpolateColor(a.color, b.color, 0.5);
      stop = { id: WUS.uid(), color: color, pos: pos };
    }
    state.stops.push(stop);
    renderStops();
    persist();
    WUS.toast('Stop added');
  }

  function removeStop(id) {
    if (state.stops.length <= 2) {
      WUS.toast('A gradient needs at least 2 stops', 'error');
      return;
    }
    state.stops = state.stops.filter(function (s) { return s.id !== id; });
    renderStops();
    persist();
  }

  function reorderStops(draggedId, targetId) {
    var fromIdx = state.stops.findIndex(function (s) { return s.id === draggedId; });
    var toIdx = state.stops.findIndex(function (s) { return s.id === targetId; });
    if (fromIdx < 0 || toIdx < 0) return;
    var item = state.stops.splice(fromIdx, 1)[0];
    state.stops.splice(toIdx, 0, item);
    renderStops();
    persist();
  }

  /* Keyboard-accessible equivalent of drag reordering: moves a stop by one
     position in the list (dir -1 = up, +1 = down) and restores focus to its
     drag handle so keyboard users can keep moving it without losing place. */
  function moveStop(id, dir) {
    var idx = state.stops.findIndex(function (s) { return s.id === id; });
    if (idx < 0) return;
    var newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= state.stops.length) return;
    var item = state.stops.splice(idx, 1)[0];
    state.stops.splice(newIdx, 0, item);
    renderStops();
    persist();
    var handleEl = stopListEl.querySelector('.stop-row[data-id="' + id + '"] .stop-drag-handle');
    if (handleEl) handleEl.focus();
  }

  /* =================================================================
     MODE / SHAPE / ANGLE CONTROLS
     ================================================================= */
  function setMode(mode) {
    state.mode = mode;
    var pairs = [[modeLinearBtn, 'linear'], [modeRadialBtn, 'radial'], [modeConicBtn, 'conic']];
    pairs.forEach(function (pair) {
      var active = pair[1] === mode;
      pair[0].classList.toggle('is-active', active);
      pair[0].setAttribute('aria-selected', active ? 'true' : 'false');
    });
    linearControls.hidden = mode !== 'linear';
    radialControls.hidden = mode !== 'radial';
    conicControls.hidden = mode !== 'conic';
    updateOutputs();
  }

  function setShape(shape) {
    state.shape = shape;
    var active = shape === 'circle';
    shapeCircleBtn.classList.toggle('is-active', active);
    shapeCircleBtn.setAttribute('aria-selected', active ? 'true' : 'false');
    shapeEllipseBtn.classList.toggle('is-active', !active);
    shapeEllipseBtn.setAttribute('aria-selected', !active ? 'true' : 'false');
    updateOutputs();
    persist();
  }

  function setAngle(v) {
    v = Math.round(WUS.clamp(v, 0, 360));
    state.angle = v;
    angleRange.value = String(v);
    angleNumber.value = String(v);
    angleValueLabel.textContent = v + '°';
    updateOutputs();
  }

  function setConicAngle(v) {
    v = Math.round(WUS.clamp(v, 0, 360));
    state.conicAngle = v;
    conicAngleRange.value = String(v);
    conicAngleNumber.value = String(v);
    conicAngleValueLabel.textContent = v + '°';
    updateOutputs();
  }

  /* =================================================================
     RANDOMIZE / RESET
     ================================================================= */
  function randomize() {
    var modes = ['linear', 'radial', 'conic'];
    state.mode = modes[Math.floor(Math.random() * modes.length)];

    var stopCount = 2 + Math.floor(Math.random() * 3); // 2-4 stops
    var baseHue = Math.floor(Math.random() * 360);
    var stops = [];
    for (var i = 0; i < stopCount; i++) {
      var hue = (baseHue + i * (30 + Math.floor(Math.random() * 50))) % 360;
      var sat = 55 + Math.floor(Math.random() * 35);
      var light = 42 + Math.floor(Math.random() * 26);
      var color = hslToHex(hue, sat, light);
      var pos = stopCount === 1 ? 0 : Math.round((i / (stopCount - 1)) * 100);
      stops.push({ id: WUS.uid(), color: color, pos: pos });
    }
    state.stops = stops;

    state.angle = Math.floor(Math.random() * 360);
    state.shape = Math.random() < 0.5 ? 'circle' : 'ellipse';
    var presetPos = [0, 25, 50, 75, 100];
    state.radialX = presetPos[Math.floor(Math.random() * presetPos.length)];
    state.radialY = presetPos[Math.floor(Math.random() * presetPos.length)];
    state.conicAngle = Math.floor(Math.random() * 360);
    state.conicX = presetPos[Math.floor(Math.random() * presetPos.length)];
    state.conicY = presetPos[Math.floor(Math.random() * presetPos.length)];

    syncControlsFromState();
    setMode(state.mode);
    renderStops();
    WUS.toast('Gradient randomized');
    persist();
  }

  function resetAll() {
    state = defaultState();
    syncControlsFromState();
    setMode(state.mode);
    renderStops();
    WUS.toast('Reset to default gradient');
    persist();
  }

  /* =================================================================
     SYNC CONTROLS ⇄ STATE (used on init/restore/preset/randomize/reset)
     ================================================================= */
  function syncControlsFromState() {
    angleRange.value = String(state.angle);
    angleNumber.value = String(state.angle);
    angleValueLabel.textContent = Math.round(state.angle) + '°';

    var circleActive = state.shape === 'circle';
    shapeCircleBtn.classList.toggle('is-active', circleActive);
    shapeCircleBtn.setAttribute('aria-selected', circleActive ? 'true' : 'false');
    shapeEllipseBtn.classList.toggle('is-active', !circleActive);
    shapeEllipseBtn.setAttribute('aria-selected', !circleActive ? 'true' : 'false');

    radialXEl.value = String(state.radialX);
    radialYEl.value = String(state.radialY);
    radialXLabel.textContent = state.radialX + '%';
    radialYLabel.textContent = state.radialY + '%';
    updatePosGridActive(radialPosGridEl, state.radialX, state.radialY);

    conicAngleRange.value = String(state.conicAngle);
    conicAngleNumber.value = String(state.conicAngle);
    conicAngleValueLabel.textContent = Math.round(state.conicAngle) + '°';

    conicXEl.value = String(state.conicX);
    conicYEl.value = String(state.conicY);
    conicXLabel.textContent = state.conicX + '%';
    conicYLabel.textContent = state.conicY + '%';
    updatePosGridActive(conicPosGridEl, state.conicX, state.conicY);
  }

  /* =================================================================
     COPY
     ================================================================= */
  function copyCss() {
    var css = buildGradientCss();
    WUS.copy('background: ' + css + ';', 'CSS copied to clipboard');
  }

  /* =================================================================
     PERSISTENCE
     ================================================================= */
  function persist() {
    WUS.store.set(STORE_KEY, state);
  }
  var persistDebounced = WUS.debounce(persist, 300);

  function restore() {
    var saved = WUS.store.get(STORE_KEY, null);
    if (!saved || !Array.isArray(saved.stops) || saved.stops.length < 2) {
      state = defaultState();
      return;
    }
    state = {
      mode: (saved.mode === 'radial' || saved.mode === 'conic') ? saved.mode : 'linear',
      angle: clampNum(saved.angle, 135, 0, 360),
      shape: saved.shape === 'ellipse' ? 'ellipse' : 'circle',
      radialX: clampNum(saved.radialX, 50, 0, 100),
      radialY: clampNum(saved.radialY, 50, 0, 100),
      conicAngle: clampNum(saved.conicAngle, 0, 0, 360),
      conicX: clampNum(saved.conicX, 50, 0, 100),
      conicY: clampNum(saved.conicY, 50, 0, 100),
      stops: saved.stops.map(function (s) {
        return {
          id: WUS.uid(),
          color: normalizeHex(s.color) || '#6366f1',
          pos: clampNum(s.pos, 0, 0, 100)
        };
      })
    };
  }

  /* =================================================================
     SHORTCUTS HELP MODAL
     ================================================================= */
  var helpBackdrop = document.getElementById('helpBackdrop');
  var helpClose    = document.getElementById('helpClose');
  var shortcutRows = document.getElementById('shortcutRows');

  var SHORTCUTS = [
    { keys: ['mod', 'C'], desc: 'Copy generated CSS' },
    { keys: ['R'], desc: 'Randomize gradient' },
    { keys: ['?'], desc: 'Show this help' },
    { keys: ['Esc'], desc: 'Close dialog' }
  ];

  function buildShortcutTable() {
    var html = '';
    SHORTCUTS.forEach(function (s) {
      var kbds = s.keys.map(function (k) { return '<kbd>' + WUS.escapeHtml(k) + '</kbd>'; }).join('');
      html += '<tr><td>' + WUS.escapeHtml(s.desc) + '</td><td>' + kbds + '</td></tr>';
    });
    shortcutRows.innerHTML = html;
  }

  function openHelp() { helpBackdrop.hidden = false; helpClose.focus(); }
  function closeHelp() { helpBackdrop.hidden = true; }

  helpClose.addEventListener('click', closeHelp);
  helpBackdrop.addEventListener('click', function (e) {
    if (e.target === helpBackdrop) closeHelp();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !helpBackdrop.hidden) closeHelp();
  });

  var helpBtns = document.querySelectorAll('[data-shortcut-help]');
  for (var hb = 0; hb < helpBtns.length; hb++) helpBtns[hb].addEventListener('click', openHelp);

  /* =================================================================
     WIRING
     ================================================================= */
  modeLinearBtn.addEventListener('click', function () { setMode('linear'); persist(); });
  modeRadialBtn.addEventListener('click', function () { setMode('radial'); persist(); });
  modeConicBtn.addEventListener('click', function () { setMode('conic'); persist(); });

  shapeCircleBtn.addEventListener('click', function () { setShape('circle'); });
  shapeEllipseBtn.addEventListener('click', function () { setShape('ellipse'); });

  angleRange.addEventListener('input', function () { setAngle(Number(angleRange.value)); persistDebounced(); });
  angleNumber.addEventListener('input', function () { setAngle(Number(angleNumber.value)); persistDebounced(); });

  conicAngleRange.addEventListener('input', function () { setConicAngle(Number(conicAngleRange.value)); persistDebounced(); });
  conicAngleNumber.addEventListener('input', function () { setConicAngle(Number(conicAngleNumber.value)); persistDebounced(); });

  radialXEl.addEventListener('input', function () {
    state.radialX = Number(radialXEl.value);
    radialXLabel.textContent = state.radialX + '%';
    updatePosGridActive(radialPosGridEl, state.radialX, state.radialY);
    updateOutputs();
    persistDebounced();
  });
  radialYEl.addEventListener('input', function () {
    state.radialY = Number(radialYEl.value);
    radialYLabel.textContent = state.radialY + '%';
    updatePosGridActive(radialPosGridEl, state.radialX, state.radialY);
    updateOutputs();
    persistDebounced();
  });
  conicXEl.addEventListener('input', function () {
    state.conicX = Number(conicXEl.value);
    conicXLabel.textContent = state.conicX + '%';
    updatePosGridActive(conicPosGridEl, state.conicX, state.conicY);
    updateOutputs();
    persistDebounced();
  });
  conicYEl.addEventListener('input', function () {
    state.conicY = Number(conicYEl.value);
    conicYLabel.textContent = state.conicY + '%';
    updatePosGridActive(conicPosGridEl, state.conicX, state.conicY);
    updateOutputs();
    persistDebounced();
  });

  btnAddStop.addEventListener('click', addStop);
  btnCopyCss.addEventListener('click', copyCss);
  btnRandomize.addEventListener('click', randomize);
  btnReset.addEventListener('click', resetAll);

  WUS.registerShortcut('mod+c', function () { copyCss(); }, 'Copy generated CSS');
  WUS.registerShortcut('r', function () { randomize(); }, 'Randomize gradient');
  WUS.registerShortcut('?', function () { openHelp(); }, 'Show shortcuts');

  /* =================================================================
     INIT
     ================================================================= */
  buildShortcutTable();
  buildPosGrid(radialPosGridEl, handleRadialPosPick);
  buildPosGrid(conicPosGridEl, handleConicPosPick);
  renderPresets();
  restore();
  syncControlsFromState();
  setMode(state.mode);
  renderStops();
  updateOutputs();
})();
