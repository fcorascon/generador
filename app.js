// ===== Estado global =====
const state = {
  img: null,          // HTMLImageElement
  imgName: '',
  names: [],          // string[]
  index: 0,
  pos: { x: 0.5, y: 0.5 }, // normalizado 0..1
  style: {
    fontSize: 72,
    fontFamily: "Montserrat, sans-serif",
    color: "#ffffff",
    bold: false,
    shadowEnabled: true,
    shadowColor: "#000000",
    shadowBlur: 8,
    offX: 2,
    offY: 2,
  },
  dragging: false,
};

// ===== Refs =====
const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const dropzone = $('dropzone'), imgInput = $('imgInput');
const imgInfo = $('imgInfo'), btnClearImg = $('btnClearImg');
const namesInput = $('namesInput'), namesCount = $('namesCount'), btnClearNames = $('btnClearNames');
const fontSize = $('fontSize'), fontSizeNum = $('fontSizeNum'), fontSizeVal = $('fontSizeVal');
const fontFamily = $('fontFamily'), fontColor = $('fontColor'), fontColorHex = $('fontColorHex');
const btnBold = $('btnBold');
const shadowEnabled = $('shadowEnabled'), shadowControls = $('shadowControls');
const shadowColor = $('shadowColor'), shadowColorHex = $('shadowColorHex');
const shadowBlur = $('shadowBlur'), shadowBlurVal = $('shadowBlurVal');
const shadowOffX = $('shadowOffX'), shadowOffY = $('shadowOffY');
const offXVal = $('offXVal'), offYVal = $('offYVal');
const posX = $('posX'), posY = $('posY'), posXVal = $('posXVal'), posYVal = $('posYVal');
const btnCenter = $('btnCenter');
const btnPrev = $('btnPrev'), btnNext = $('btnNext'), previewLabel = $('previewLabel');
const btnPng = $('btnPng'), btnZip = $('btnZip'), zipCount = $('zipCount'), statusEl = $('status');
const canvasSize = $('canvasSize');

// ===== 1. Subir imagen =====
dropzone.addEventListener('click', () => imgInput.click());
imgInput.addEventListener('change', (e) => { if (e.target.files[0]) loadImage(e.target.files[0]); });
['dragover', 'dragenter'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
dropzone.addEventListener('drop', (e) => {
  const f = e.dataTransfer.files[0];
  if (f) loadImage(f);
});

function loadImage(file) {
  if (!file.type.startsWith('image/')) { setStatus('❌ El archivo no es una imagen.'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    const im = new Image();
    im.onload = () => {
      state.img = im;
      state.imgName = file.name;
      canvas.width = im.naturalWidth;
      canvas.height = im.naturalHeight;
      imgInfo.textContent = `${file.name} (${im.naturalWidth}×${im.naturalHeight})`;
      btnClearImg.disabled = false;
      canvasSize.textContent = `${canvas.width} × ${canvas.height} px`;
      render();
      updateButtons();
      setStatus('✅ Imagen cargada.');
    };
    im.src = reader.result;
  };
  reader.readAsDataURL(file);
}

btnClearImg.addEventListener('click', () => {
  state.img = null; state.imgName = '';
  canvas.width = 800; canvas.height = 600;
  imgInfo.textContent = 'Sin imagen';
  btnClearImg.disabled = true;
  imgInput.value = '';
  canvasSize.textContent = '800 × 600 px';
  render(); updateButtons();
});

// ===== 2. Nombres =====
function parseNames() {
  state.names = namesInput.value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  if (state.index >= state.names.length) state.index = Math.max(0, state.names.length - 1);
  namesCount.textContent = `${state.names.length} tarjeta(s)`;
  zipCount.textContent = state.names.length;
  updateButtons();
  render();
}
namesInput.addEventListener('input', parseNames);
btnClearNames.addEventListener('click', () => { namesInput.value = ''; parseNames(); });

function currentName() {
  if (state.names.length === 0) return 'Tu Nombre Aquí';
  return state.names[state.index] || '';
}

btnPrev.addEventListener('click', () => {
  if (!state.names.length) return;
  state.index = (state.index - 1 + state.names.length) % state.names.length;
  render();
});
btnNext.addEventListener('click', () => {
  if (!state.names.length) return;
  state.index = (state.index + 1) % state.names.length;
  render();
});

// ===== 3. Estilos =====
function syncFontSize(v) {
  state.style.fontSize = Math.max(10, Math.min(400, parseInt(v) || 72));
  fontSize.value = state.style.fontSize;
  fontSizeNum.value = state.style.fontSize;
  fontSizeVal.textContent = state.style.fontSize + 'px';
  render();
}
fontSize.addEventListener('input', e => syncFontSize(e.target.value));
fontSizeNum.addEventListener('input', e => syncFontSize(e.target.value));
fontFamily.addEventListener('change', e => { state.style.fontFamily = e.target.value; render(); });

btnBold.addEventListener('click', () => {
  state.style.bold = !state.style.bold;
  btnBold.classList.toggle('active', state.style.bold);
  render();
});

function syncColor(picker, hexInput, cb) {
  picker.addEventListener('input', e => { hexInput.value = e.target.value; cb(e.target.value); render(); });
  hexInput.addEventListener('input', e => {
    let v = e.target.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) { picker.value = v; cb(v); render(); }
  });
}
syncColor(fontColor, fontColorHex, v => state.style.color = v);
syncColor(shadowColor, shadowColorHex, v => state.style.shadowColor = v);

shadowEnabled.addEventListener('change', e => {
  state.style.shadowEnabled = e.target.checked;
  shadowControls.style.opacity = state.style.shadowEnabled ? '1' : '.4';
  shadowControls.style.pointerEvents = state.style.shadowEnabled ? 'auto' : 'none';
  render();
});
shadowBlur.addEventListener('input', e => { state.style.shadowBlur = +e.target.value; shadowBlurVal.textContent = e.target.value; render(); });
shadowOffX.addEventListener('input', e => { state.style.offX = +e.target.value; offXVal.textContent = e.target.value; render(); });
shadowOffY.addEventListener('input', e => { state.style.offY = +e.target.value; offYVal.textContent = e.target.value; render(); });

// Posición sliders
function syncPosUI() {
  posX.value = Math.round(state.pos.x * 100);
  posY.value = Math.round(state.pos.y * 100);
  posXVal.textContent = posX.value + '%';
  posYVal.textContent = posY.value + '%';
}
posX.addEventListener('input', e => { state.pos.x = e.target.value / 100; syncPosUI(); render(); });
posY.addEventListener('input', e => { state.pos.y = e.target.value / 100; syncPosUI(); render(); });
btnCenter.addEventListener('click', () => { state.pos = { x: 0.5, y: 0.5 }; syncPosUI(); render(); });

// ===== 4. Render + drag =====
function fontString() {
  const b = state.style.bold ? '900 ' : '700 ';
  return `${b}${state.style.fontSize}px ${state.style.fontFamily}`;
}

function drawCard(targetCtx, W, H, text) {
  targetCtx.clearRect(0, 0, W, H);
  // fondo
  if (state.img) {
    targetCtx.drawImage(state.img, 0, 0, W, H);
  } else {
    targetCtx.fillStyle = '#334155';
    targetCtx.fillRect(0, 0, W, H);
    targetCtx.fillStyle = '#64748b';
    targetCtx.font = '400 28px sans-serif';
    targetCtx.textAlign = 'center';
    targetCtx.fillText('Sube una imagen base (1)', W / 2, H / 2 - 20);
  }
  // texto
  const x = state.pos.x * W;
  const y = state.pos.y * H;
  targetCtx.save();
  targetCtx.font = fontString();
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillStyle = state.style.color;
  if (state.style.shadowEnabled) {
    targetCtx.shadowColor = state.style.shadowColor;
    targetCtx.shadowBlur = state.style.shadowBlur;
    targetCtx.shadowOffsetX = state.style.offX;
    targetCtx.shadowOffsetY = state.style.offY;
  } else {
    targetCtx.shadowColor = 'transparent';
    targetCtx.shadowBlur = 0;
    targetCtx.shadowOffsetX = 0;
    targetCtx.shadowOffsetY = 0;
  }
  targetCtx.fillText(text, x, y);
  targetCtx.restore();
  return { x, y };
}

let lastBox = null; // para hit-test y guía
function render() {
  const W = canvas.width, H = canvas.height;
  const text = currentName();
  const { x, y } = drawCard(ctx, W, H, text);

  // medir caja para drag + guía
  ctx.save();
  ctx.font = fontString();
  const w = ctx.measureText(text).width;
  ctx.restore();
  const h = state.style.fontSize * 1.2;
  lastBox = { x: x - w / 2 - 12, y: y - h / 2 - 8, w: w + 24, h: h + 16, cx: x, cy: y };

  // guía sutil al arrastrar
  if (state.dragging) {
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(lastBox.x, lastBox.y, lastBox.w, lastBox.h);
    // cruz central
    ctx.strokeStyle = 'rgba(56,189,248,.5)';
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
    ctx.restore();
  }

  previewLabel.textContent = state.names.length ? `${state.index + 1} / ${state.names.length}` : '0 / 0';
}

function toCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = toCanvasCoords(e);
  if (lastBox && p.x >= lastBox.x && p.x <= lastBox.x + lastBox.w &&
      p.y >= lastBox.y && p.y <= lastBox.y + lastBox.h) {
    state.dragging = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
    canvas.focus();
  }
});
canvas.addEventListener('pointermove', (e) => {
  if (!state.dragging) return;
  const p = toCanvasCoords(e);
  state.pos.x = Math.min(1, Math.max(0, p.x / canvas.width));
  state.pos.y = Math.min(1, Math.max(0, p.y / canvas.height));
  syncPosUI();
  render();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
  canvas.addEventListener(ev, () => { state.dragging = false; canvas.classList.remove('dragging'); render(); })
);

// flechas para micro-ajuste
canvas.addEventListener('keydown', (e) => {
  const step = e.shiftKey ? 0.02 : 0.005;
  let used = true;
  if (e.key === 'ArrowLeft') state.pos.x -= step;
  else if (e.key === 'ArrowRight') state.pos.x += step;
  else if (e.key === 'ArrowUp') state.pos.y -= step;
  else if (e.key === 'ArrowDown') state.pos.y += step;
  else used = false;
  if (used) {
    e.preventDefault();
    state.pos.x = Math.min(1, Math.max(0, state.pos.x));
    state.pos.y = Math.min(1, Math.max(0, state.pos.y));
    syncPosUI(); render();
  }
});

// ===== 5. Descarga =====
function sanitize(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'tarjeta';
}

function updateButtons() {
  const hasNames = state.names.length > 0;
  const hasImg = !!state.img;
  btnPng.disabled = !(hasImg && hasNames);
  btnZip.disabled = !(hasImg && hasNames);
  // tooltip útil
  btnPng.title = !hasImg ? 'Sube primero una imagen' : (!hasNames ? 'Escribe al menos un nombre' : '');
  btnZip.title = btnPng.title;
}

function setStatus(msg) {
  statusEl.textContent = msg;
  if (msg) setTimeout(() => { if (statusEl.textContent === msg) statusEl.textContent = ''; }, 4000);
}

function makeOffscreen(name) {
  const c = document.createElement('canvas');
  c.width = canvas.width; c.height = canvas.height;
  drawCard(c.getContext('2d'), c.width, c.height, name);
  return c;
}

btnPng.addEventListener('click', () => {
  if (btnPng.disabled) return;
  const name = currentName();
  makeOffscreen(name).toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tarjeta-${sanitize(name)}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`✅ PNG descargado: ${name}`);
  }, 'image/png');
});

btnZip.addEventListener('click', async () => {
  if (btnZip.disabled) return;
  if (typeof JSZip === 'undefined') { setStatus('❌ JSZip no cargó (revisa internet).'); return; }
  try {
    setStatus(`⏳ Generando ${state.names.length} tarjetas...`);
    btnZip.disabled = true; btnPng.disabled = true;
    const zip = new JSZip();
    for (const name of state.names) {
      const c = makeOffscreen(name);
      const blob = await new Promise(res => c.toBlob(res, 'image/png'));
      const buf = await blob.arrayBuffer();
      zip.file(`tarjeta-${sanitize(name)}.png`, buf);
    }
    const out = await zip.generateAsync({ type: 'blob' }, (meta) => {
      setStatus(`⏳ Comprimiendo ${Math.round(meta.percent)}%...`);
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(out);
    a.download = 'tarjetas.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000);
    setStatus(`✅ ZIP con ${state.names.length} tarjetas descargado.`);
  } catch (err) {
    console.error(err);
    setStatus('❌ Error generando ZIP.');
  } finally {
    updateButtons();
  }
});

// init
syncPosUI();
parseNames();
render();
updateButtons();
