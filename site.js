// Conttab | Lucas Lorran: WhatsApp com mensagem pronta (diz de onde a pessoa veio), interruptor ON,
// revelar ao rolar e cookies (Google e Meta só carregam depois do "Aceitar").
(function () {
  var C = window.CONTTAB || {};
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  // ---------- de onde veio: Google, Instagram/Facebook ou direto no site
  var q = new URLSearchParams(location.search), fonte = (q.get('utm_source') || '').toLowerCase(), ref = document.referrer || '';
  var origem = (q.get('gclid') || q.get('gbraid') || q.get('wbraid') || /google/.test(fonte) || /\/\/(www\.)?google\./.test(ref)) ? 'pelo Google'
    : (q.get('fbclid') || /(facebook|instagram|meta|^ig$|^fb$)/.test(fonte) || /(facebook|instagram)\.com/.test(ref)) ? 'pelo Instagram' : '';
  try {
    if (origem) sessionStorage.setItem('ct-origem', origem); else origem = sessionStorage.getItem('ct-origem') || 'pelo site';
  } catch (e) { origem = origem || 'pelo site'; }

  function linkZap(caso) {
    var msg = 'Olá, Lucas! Vi a sua contabilidade ' + origem + (caso ? '. ' + caso : ' e quero saber mais.');
    return 'https://wa.me/' + C.wpp + '?text=' + encodeURIComponent(msg);
  }
  document.querySelectorAll('.wz').forEach(function (a) {
    a.href = linkZap(a.getAttribute('data-caso'));
    a.addEventListener('click', function () { evento(a.getAttribute('data-caso') || 'geral'); });
  });

  // ---------- interruptor ON: liga sozinho a primeira vez que aparece, depois a pessoa brinca
  var botao = document.getElementById('botaoOn'), painel = document.getElementById('painel'), estado = document.getElementById('estado'), texto = document.getElementById('textoOn');
  function liga(on) {
    botao.setAttribute('aria-pressed', on ? 'true' : 'false');
    painel.classList.toggle('ligado', on);
    estado.textContent = on ? 'ON' : 'OFF';
    texto.textContent = on ? 'Conttab ligada' : 'Ligar a Conttab';
  }
  if (botao) {
    botao.addEventListener('click', function () { liga(botao.getAttribute('aria-pressed') !== 'true'); });
    var jaLigou = false;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !jaLigou) { jaLigou = true; setTimeout(function () { liga(true); }, 1400); }
    }, { threshold: 0.5 }).observe(painel);
  }

  // ---------- revelar ao rolar
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  // ---------- cookies e medição (LGPD)
  var CHAVE = 'ct-cookies', aviso = document.getElementById('cookies');
  function ler() { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem(CHAVE, v); } catch (e) {} }
  function mostrar(on) { aviso.classList.toggle('on', on); document.body.classList.toggle('com-aviso', on); }
  var medindo = false;
  function ligaMedicao() {
    if (medindo) return; medindo = true;
    if (local) { console.log('[conttab] medição ligada (localhost: não envia)'); return; }
    if (C.googleTag) {
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.googleTag; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date()); gtag('config', C.googleTag);
    }
    if (C.metaPixel) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', C.metaPixel); fbq('track', 'PageView');
    }
  }
  function evento(caso) {
    if (!medindo) return;
    if (local) { console.log('[conttab] clique no WhatsApp:', caso, origem); return; }
    if (window.gtag) {
      gtag('event', 'generate_lead', { method: 'whatsapp', caso: caso });
      if (C.googleConversao) gtag('event', 'conversion', { send_to: C.googleConversao });
    }
    if (window.fbq) fbq('track', 'Contact', { content_name: caso });
  }
  var escolha = ler();
  if (escolha === 'aceito') ligaMedicao(); else if (escolha !== 'recusado') mostrar(true);
  document.getElementById('ck-sim').onclick = function () { gravar('aceito'); mostrar(false); ligaMedicao(); };
  document.getElementById('ck-nao').onclick = function () {
    gravar('recusado'); mostrar(false);
    if (window.fbq) fbq('consent', 'revoke');
    ['_fbp', '_fbc', '_ga', '_gcl_au'].forEach(function (n) { document.cookie = n + '=; Max-Age=0; path=/'; });
  };
  document.querySelectorAll('[data-cookies]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); mostrar(true); }); });
})();
