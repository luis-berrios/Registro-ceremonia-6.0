/* ============================================================
   LÓGICA DEL MAESTRO DE CEREMONIA
   ============================================================ */

(function() {
  'use strict';

  let palabras = [];
  let idxActual = 0;
  let modoEscucha = false;
  let recognition = null;
  let speedFactor = 1;
  let fontSize = 40;
  let modoEstricto = true;
  let eventosSinAvance = 0;
  const UMBRAL_SALVAVIDAS = 4;
  const VENTANA_SALVAVIDAS = 10;
  let autoScroll = true;
  let ceremoniaIniciada = false;

  const vista = document.getElementById('vista-maestro');
  const script = document.getElementById('tp-script');
  const reader = document.getElementById('tp-reader');
  const statusEl = document.getElementById('tp-status');
  
  if (!vista) return; // Si no existe la vista, no hacer nada

  const STOPWORDS = new Set(['eh','em','mm','uh','ah','y','o','a','de','la','el','en','un','una']);

  function normaliza(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ ]/g,'').trim();
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n; if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
    }
    return dp[m][n];
  }

  function coincide(tok, ref) {
    if (tok === ref) return true; if (!tok || !ref) return false;
    const dist = levenshtein(tok, ref);
    if (ref.length <= 3) return dist === 0;
    if (ref.length <= 5) return dist <= 1;
    return dist <= 2;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function construirPalabras(texto) {
    const limpio = texto.replace(/\r\n/g, '\n').trim();
    palabras = [];
    const regex = /\(\(\s*NO\s*LEER\s*:?\s*([\s\S]*?)\)\)/gi;
    let ultimoIndex = 0, match;
    const segmentos = [];

    while ((match = regex.exec(limpio)) !== null) {
      if (match.index > ultimoIndex) segmentos.push({ tipo: 'normal', texto: limpio.slice(ultimoIndex, match.index) });
      segmentos.push({ tipo: 'noleer', texto: match[1].trim() });
      ultimoIndex = regex.lastIndex;
    }
    if (ultimoIndex < limpio.length) segmentos.push({ tipo: 'normal', texto: limpio.slice(ultimoIndex) });

    let primera = true;
    for (const seg of segmentos) {
      if (seg.tipo === 'noleer') {
        palabras.push({ texto: seg.texto, estado: 'noleer', saltoAntes: !primera, esNoLeer: true });
        primera = false; continue;
      }
      const lineas = seg.texto.split('\n');
      for (let l = 0; l < lineas.length; l++) {
        const palabrasLinea = lineas[l].trim().split(/\s+/).filter(Boolean);
        for (let w = 0; w < palabrasLinea.length; w++) {
          palabras.push({ texto: palabrasLinea[w], estado: 'pendiente', saltoAntes: (w === 0 && !primera), esNoLeer: false });
          primera = false;
        }
      }
    }

    idxActual = 0;
    while (idxActual < palabras.length && palabras[idxActual].esNoLeer) idxActual++;
    for (let i = 0; i < palabras.length; i++) {
      if (palabras[i].esNoLeer) palabras[i].estado = 'noleer';
      else if (i < idxActual) palabras[i].estado = 'leido';
      else if (i === idxActual) palabras[i].estado = 'actual';
      else palabras[i].estado = 'pendiente';
    }
    eventosSinAvance = 0;
    render();
  }

  function render() {
    if (palabras.length === 0) {
      script.innerHTML = '<div style="color:#888;font-size:18px;">Carga un libreto con el botón 📂 Cargar libreto</div>';
      return;
    }
    const parts = [];
    for (let i = 0; i < palabras.length; i++) {
      const p = palabras[i];
      if (p.saltoAntes) parts.push('<span class="tp-linebreak"></span>');
      if (p.esNoLeer) parts.push(`<span class="tp-noleer" data-i="${i}">${escapeHtml(p.texto)}</span>`);
      else parts.push(`<span class="${p.estado}" data-i="${i}">${escapeHtml(p.texto)}</span>`);
    }
    script.innerHTML = parts.join(' ');
    requestAnimationFrame(() => { if (autoScroll) scrollAlActual(false); });
  }

  function scrollAlActual(suave = true) {
    const el = script.querySelector('.tp-actual');
    if (!el) return;
    const readerRect = reader.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offsetDentro = elRect.top - readerRect.top + reader.scrollTop;
    const target = offsetDentro - (reader.clientHeight / 2) + (elRect.height / 2);
    reader.scrollTo({ top: target * speedFactor, behavior: suave ? 'smooth' : 'auto' });
  }

  let scrollTimeout = null;
  reader.addEventListener('scroll', () => {
    if (!autoScroll) { clearTimeout(scrollTimeout); scrollTimeout = setTimeout(() => { autoScroll = true; }, 2000); }
  });

  function esNoLeer(i) { return palabras[i] && palabras[i].esNoLeer; }
  function siguienteIdxNoNoLeer(desde) { let i = desde; while (i < palabras.length && esNoLeer(i)) i++; return i; }
  function anteriorIdxNoNoLeer(desde) { let i = desde; while (i >= 0 && esNoLeer(i)) i--; return i; }

  function irA(nuevoIdx, mantenerAutoScroll = true) {
    if (palabras.length === 0) return;
    nuevoIdx = Math.max(0, Math.min(palabras.length - 1, nuevoIdx));
    if (esNoLeer(nuevoIdx)) nuevoIdx = siguienteIdxNoNoLeer(nuevoIdx);
    if (nuevoIdx >= palabras.length) nuevoIdx = anteriorIdxNoNoLeer(palabras.length - 1);
    if (nuevoIdx < 0) return;

    for (let i = 0; i < palabras.length; i++) {
      if (palabras[i].esNoLeer) { palabras[i].estado = 'noleer'; continue; }
      palabras[i].estado = i < nuevoIdx ? 'leido' : i === nuevoIdx ? 'actual' : 'pendiente';
    }
    idxActual = nuevoIdx; eventosSinAvance = 0; autoScroll = mantenerAutoScroll; render();
  }

  function siguiente() { const idx = siguienteIdxNoNoLeer(idxActual + 1); if (idx < palabras.length) irA(idx); }
  function anterior() { const idx = anteriorIdxNoNoLeer(idxActual - 1); if (idx >= 0) irA(idx); }

  function avanzarKaraoke(nuevoIdxActual) {
    if (nuevoIdxActual <= idxActual) return;
    if (nuevoIdxActual >= palabras.length) { irA(anteriorIdxNoNoLeer(palabras.length - 1)); return; }
    irA(nuevoIdxActual);
  }

  script.addEventListener('click', (ev) => {
    const span = ev.target.closest('span[data-i]');
    if (!span) return;
    const i = parseInt(span.dataset.i);
    if (isNaN(i) || esNoLeer(i)) return;
    irA(i, true);
    setStatus('📍 Reposicionado');
  });

  function calcularAvanceEstricto(tokens) {
    if (tokens.length === 0 || idxActual >= palabras.length - 1) return -1;
    const actualNorm = normaliza(palabras[idxActual].texto);
    for (let start = 0; start < Math.min(tokens.length, 3); start++) {
      const tok = tokens[start];
      if (STOPWORDS.has(tok) && tok.length <= 2) continue;
      if (coincide(tok, actualNorm)) {
        const sigLibreto = idxActual + 1 < palabras.length ? normaliza(palabras[idxActual + 1].texto) : null;
        const sigToken = tokens[start + 1];
        if (sigLibreto && sigToken && coincide(sigToken, sigLibreto)) {
          let avance = 1, j = start + 1, k = idxActual + 1;
          while (j < tokens.length && k < palabras.length && !esNoLeer(k) && coincide(tokens[j], normaliza(palabras[k].texto))) { avance++; j++; k++; }
          return idxActual + avance;
        }
        return idxActual + 1;
      }
      const sigLibreto = idxActual + 1 < palabras.length ? normaliza(palabras[idxActual + 1].texto) : null;
      if (sigLibreto && coincide(tok, sigLibreto)) {
        const sigToken = tokens[start + 1];
        const subLibreto = idxActual + 2 < palabras.length ? normaliza(palabras[idxActual + 2].texto) : null;
        if (sigToken && subLibreto && coincide(sigToken, subLibreto)) return idxActual + 2;
      }
    }
    return -1;
  }

  function calcularSalvavidas(tokens) {
    if (tokens.length === 0) return -1;
    const limite = Math.min(palabras.length, idxActual + VENTANA_SALVAVIDAS);
    for (let i = idxActual + 1; i < limite; i++) {
      if (esNoLeer(i)) continue;
      const refNorm = normaliza(palabras[i].texto);
      for (let t = 0; t < tokens.length; t++) {
        if (STOPWORDS.has(tokens[t]) && tokens[t].length <= 2) continue;
        if (!coincide(tokens[t], refNorm)) continue;
        const sigRef = i + 1 < palabras.length ? normaliza(palabras[i + 1].texto) : null;
        const sigTok = tokens[t + 1];
        if (sigRef && sigTok && coincide(sigTok, sigRef)) return i + 1;
      }
    }
    return -1;
  }

  function calcularAvanceTolerante(tokens) {
    if (tokens.length === 0) return -1;
    const limite = Math.min(palabras.length, idxActual + 10);
    let cursor = idxActual, ultimo = -1, confirmadas = 0;
    for (const tok of tokens) {
      if (STOPWORDS.has(tok) && tok.length <= 2) continue;
      let encontrado = -1;
      for (let i = cursor; i < limite; i++) {
        if (esNoLeer(i)) continue;
        if (coincide(tok, normaliza(palabras[i].texto))) { encontrado = i; break; }
      }
      if (encontrado !== -1) { ultimo = encontrado; cursor = encontrado + 1; confirmadas++; }
    }
    if (confirmadas < 2) return -1;
    return ultimo === -1 ? -1 : ultimo + 1;
  }

  function initRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus('Este navegador no soporta reconocimiento de voz. Usa Chrome/Edge.', 'err'); return null; }
    const r = new SR();
    r.lang = 'es-CL'; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;

    r.onresult = (event) => {
      let texto = '';
      for (let i = 0; i < event.results.length; i++) texto += ' ' + event.results[i][0].transcript;
      const tokens = normaliza(texto).split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return;
      const recientes = tokens.slice(-8);
      const idxAntes = idxActual;

      if (modoEstricto) {
        let proximo = calcularAvanceEstricto(recientes);
        if (proximo === -1) {
          eventosSinAvance++;
          if (eventosSinAvance >= UMBRAL_SALVAVIDAS) {
            proximo = calcularSalvavidas(recientes);
            if (proximo !== -1) { eventosSinAvance = 0; setStatus('🛟 Salvavidas', 'on'); }
          }
        } else eventosSinAvance = 0;
        if (proximo > idxActual) avanzarKaraoke(proximo);
      } else {
        const proximo = calcularAvanceTolerante(recientes);
        if (proximo > idxActual) avanzarKaraoke(proximo);
      }
      if (idxActual > idxAntes) eventosSinAvance = 0;
      if (idxActual === idxAntes) setStatus('🎙 ' + texto.slice(-45), 'on');
    };

    r.onerror = (e) => {
      setStatus('Error de voz: ' + e.error, 'err');
      if (e.error === 'not-allowed') { alert('Permiso de micrófono denegado.'); detener(); }
    };
    r.onend = () => { if (modoEscucha) { try { r.start(); } catch(_) {} } };
    return r;
  }

  function iniciar() {
    if (modoEscucha || palabras.length === 0) return;
    if (!recognition) recognition = initRecognition();
    if (!recognition) return;
    modoEscucha = true; eventosSinAvance = 0; autoScroll = true;
    try { recognition.start(); } catch(_) {}
    document.getElementById('tp-btn-start').disabled = true;
    document.getElementById('tp-btn-stop').disabled = false;
    setStatus('🎙 Escuchando…', 'on');
  }

  function detener() {
    modoEscucha = false;
    if (recognition) { try { recognition.stop(); } catch(_) {} }
    document.getElementById('tp-btn-start').disabled = false;
    document.getElementById('tp-btn-stop').disabled = true;
    setStatus('Detenido');
  }

  function setStatus(msg, cls = '') { if (statusEl) { statusEl.textContent = msg; statusEl.className = cls; } }

  function actualizarBotonIniciar() {
    const btn = document.getElementById('tp-btn-iniciar');
    if (!btn) return;
    if (ceremoniaIniciada) { btn.textContent = '✅ Ceremonia iniciada'; btn.classList.add('iniciada'); btn.disabled = true; }
    else { btn.textContent = '▶ Iniciar ceremonia'; btn.classList.remove('iniciada'); btn.disabled = false; }
  }

  function iniciarCeremonia() {
    if (ceremoniaIniciada) return;
    if (!confirm('¿Marcar el inicio de la ceremonia?')) return;
    ceremoniaIniciada = true; actualizarBotonIniciar();
    try { localStorage.setItem('tp_ceremonia_iniciada', '1'); } catch(_) {}
    setStatus('✅ Ceremonia iniciada');
  }

  function mostrarVista() {
    vista.classList.add('activa');
    // Cargar libreto guardado si existe
    try {
      const texto = localStorage.getItem('tp_libreto_texto');
      if (texto) construirPalabras(texto);
    } catch(_) {}
    try { if (localStorage.getItem('tp_ceremonia_iniciada') === '1') { ceremoniaIniciada = true; actualizarBotonIniciar(); } } catch(_) {}
  }

  function ocultarVista() {
    vista.classList.remove('activa');
    detener();
  }

  // Configurar botones
  const btnStart = document.getElementById('tp-btn-start');
  const btnStop = document.getElementById('tp-btn-stop');
  if (btnStart) btnStart.onclick = iniciar;
  if (btnStop) btnStop.onclick = detener;
  document.getElementById('tp-btn-prev').onclick = anterior;
  document.getElementById('tp-btn-next').onclick = siguiente;
  document.getElementById('tp-btn-iniciar').onclick = iniciarCeremonia;
  document.getElementById('tp-btn-full').onclick = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  document.getElementById('tp-btn-font-up').onclick = () => { fontSize = Math.min(120, fontSize + 4); script.style.fontSize = fontSize + 'px'; setTimeout(() => { if (autoScroll) scrollAlActual(false); }, 30); };
  document.getElementById('tp-btn-font-down').onclick = () => { fontSize = Math.max(16, fontSize - 4); script.style.fontSize = fontSize + 'px'; setTimeout(() => { if (autoScroll) scrollAlActual(false); }, 30); };
  
  document.getElementById('tp-speed').oninput = (e) => { speedFactor = parseFloat(e.target.value); };
  document.getElementById('tp-modo-estricto').onchange = (e) => { modoEstricto = e.target.checked; eventosSinAvance = 0; setStatus(modoEstricto ? 'Modo estricto' : 'Modo tolerante'); };

  document.getElementById('tp-btn-cargar').onclick = () => document.getElementById('tp-file-input').click();
  document.getElementById('tp-file-input').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const nombre = file.name.toLowerCase();

    if (nombre.endsWith('.docx')) {
      if (typeof mammoth === 'undefined') { alert('La librería Mammoth.js no está cargada.'); return; }
      try {
        setStatus('Extrayendo texto del .docx…');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const texto = (result.value || '').trim();
        if (!texto) { alert('El Word no tiene texto extraíble.'); return; }
        
        try { localStorage.setItem('tp_libreto_texto', texto); } catch(_) {}
        construirPalabras(texto);
        setStatus('✅ Word cargado');
      } catch (err) {
        alert('Error al leer Word: ' + err.message);
      }
      return;
    }

    // Para archivos .txt u otros de texto
    const readerObj = new FileReader();
    readerObj.onload = function(evt) {
      const texto = evt.target.result;
      try { localStorage.setItem('tp_libreto_texto', texto); } catch(_) {}
      construirPalabras(texto);
      setStatus('✅ Texto cargado');
    };
    readerObj.readAsText(file, 'UTF-8');
  });

  document.getElementById('tp-btn-salir').onclick = function() {
    if (confirm('¿Estás seguro de que deseas salir del modo Maestro de Ceremonia?')) {
      localStorage.removeItem('rolUsuario');
      localStorage.removeItem('nombreUsuario');
      window.location.reload();
    }
  };

  document.addEventListener('keydown', (e) => {
    if (!vista.classList.contains('activa')) return;
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); siguiente(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); anterior(); }
    else if (e.key === 'Home') { e.preventDefault(); irA(0); }
  });

  window.addEventListener('resize', () => { if (autoScroll) scrollAlActual(false); });

  window.Maestro = { mostrar: mostrarVista, ocultar: ocultarVista };

})();
