/* @ds-bundle: {"format":4,"namespace":"Nekotype","components":[{"name":"TestArea"},{"name":"Char"},{"name":"TranslationLine"},{"name":"Notice"},{"name":"Kbd"},{"name":"ModePanel"},{"name":"RowPicker"},{"name":"Dialog"},{"name":"Button"},{"name":"Segmented"},{"name":"Switch"},{"name":"Input"},{"name":"Textarea"},{"name":"Select"},{"name":"Tooltip"},{"name":"Stat"},{"name":"PersonalBestBadge"},{"name":"ResultChart"},{"name":"WeakKanaList"},{"name":"KanaChart"},{"name":"HistoryTable"},{"name":"Pagination"},{"name":"OptionCard"},{"name":"VerticalLabel"},{"name":"Nav"},{"name":"Footer"},{"name":"Cat"},{"name":"EmptyState"}]} */
(function () {
  'use strict';
  var React = window.React;
  var h = React.createElement;
  var useState = React.useState, useRef = React.useRef, useLayoutEffect = React.useLayoutEffect, useEffect = React.useEffect,
    useId = React.useId, useImperativeHandle = React.useImperativeHandle, forwardRef = React.forwardRef;
  var CAT = {"cats":{"line":{"neutral":[["path",{"d":"M84 58C91 70 88 86 70 86L27 86C19 80 19 62 32 53C26 47 26 36 29.5 29L31 11L43.5 20.5Q48 19.2 52.5 20.5L65 11L66.5 29C70 36 70 47 64 53C73 61 74 74 70 83"},"line"],["path",{"d":"M36.8 37.0Q41.0 31.2 45.2 37.0Q41.0 42.8 36.8 37.0Z"},"eye"],["rect",{"x":"40.30","y":"34.6","width":"1.4","height":"4.8","rx":"0.70"},"cut"],["path",{"d":"M50.8 37.0Q55.0 31.2 59.2 37.0Q55.0 42.8 50.8 37.0Z"},"eye"],["rect",{"x":"54.30","y":"34.6","width":"1.4","height":"4.8","rx":"0.70"},"cut"]],"sleep":[["path",{"d":"M36 77C28 77 22 79 24 83C25 84 27 84 30 84L76 84C88 84 90 70 82 63C76 58 66 57 58 59C59 54 58 49 55 45L56 31L46 38Q41 37 36 38L26 31L27 45C21 53 21 65 26 71"},"line"],["path",{"d":"M32.5 55.0Q35.5 58.0 38.5 55.0"},"line"],["path",{"d":"M43.5 55.0Q46.5 58.0 49.5 55.0"},"line"]],"content":[["path",{"d":"M84 58C91 70 88 86 70 86L27 86C19 80 19 62 32 53C26 47 26 36 29.5 29L31 11L43.5 20.5Q48 19.2 52.5 20.5L65 11L66.5 29C70 36 70 47 64 53C73 61 74 74 70 83"},"line"],["path",{"d":"M36.8 37.0Q41.0 35.8 45.2 37.0Q41.0 42.0 36.8 37.0Z"},"eye"],["path",{"d":"M50.8 37.0Q55.0 35.8 59.2 37.0Q55.0 42.0 50.8 37.0Z"},"eye"]]},"geometry":{"neutral":[["path",{"d":"M26 86L26 72A22 22 0 0 1 70 72L70 86Z"},"fur"],["path",{"d":"M70 86L84 86A14 14 0 0 0 70 72L70 78A8 8 0 0 1 78 86Z"},"fur"],["circle",{"cx":"48","cy":"36","r":"18"},"fur"],["circle",{"cx":"48","cy":"36","r":"18","fill":"none"},"gap"],["path",{"d":"M33 32L29 11L46 21Z"},"fur"],["path",{"d":"M63 32L67 11L50 21Z"},"fur"],["circle",{"cx":"48","cy":"36","r":"17"},"fur"],["circle",{"cx":"41","cy":"37","r":"3.4"},"eye"],["rect",{"x":"40.30","y":"34.7","width":"1.4","height":"4.6","rx":"0.70"},"cut"],["circle",{"cx":"55","cy":"37","r":"3.4"},"eye"],["rect",{"x":"54.30","y":"34.7","width":"1.4","height":"4.6","rx":"0.70"},"cut"]],"sleep":[["path",{"d":"M14 84A34 30 0 0 1 82 84Z"},"fur"],["path",{"d":"M82 84A12 12 0 0 0 70 72L70 78A6 6 0 0 1 76 84Z"},"fur"],["circle",{"cx":"38","cy":"56","r":"15"},"fur"],["circle",{"cx":"38","cy":"56","r":"15","fill":"none"},"gap"],["path",{"d":"M25 52L22 35L36 43Z"},"fur"],["path",{"d":"M51 52L54 35L40 43Z"},"fur"],["circle",{"cx":"38","cy":"56","r":"14"},"fur"],["path",{"d":"M29.8 57.0Q32.5 60.0 35.2 57.0"},"cutline"],["path",{"d":"M40.8 57.0Q43.5 60.0 46.2 57.0"},"cutline"]],"content":[["path",{"d":"M26 86L26 72A22 22 0 0 1 70 72L70 86Z"},"fur"],["path",{"d":"M70 86L84 86A14 14 0 0 0 70 72L70 78A8 8 0 0 1 78 86Z"},"fur"],["circle",{"cx":"48","cy":"36","r":"18"},"fur"],["circle",{"cx":"48","cy":"36","r":"18","fill":"none"},"gap"],["path",{"d":"M33 32L29 11L46 21Z"},"fur"],["path",{"d":"M63 32L67 11L50 21Z"},"fur"],["circle",{"cx":"48","cy":"36","r":"17"},"fur"],["path",{"d":"M37.6 37A3.4 3.4 0 0 0 44.4 37Z"},"eye"],["path",{"d":"M51.6 37A3.4 3.4 0 0 0 58.4 37Z"},"eye"]]},"silhouette":{"neutral":[["path",{"d":"M30 86C20 78 19 62 31 53C26 46 26 36 29.5 29L31 10L43.5 20.5Q48 19.2 52.5 20.5L65 10L66.5 29C70 36 70 46 65 53C70 57 72 62 73 67C78 63 82 60 84 54C86 50 90 51 90 55C90 66 84 78 74 84L72 86Z"},"fur"],["path",{"d":"M36.8 37.0Q41.0 31.2 45.2 37.0Q41.0 42.8 36.8 37.0Z"},"eye"],["rect",{"x":"40.30","y":"34.6","width":"1.4","height":"4.8","rx":"0.70"},"cut"],["path",{"d":"M50.8 37.0Q55.0 31.2 59.2 37.0Q55.0 42.8 50.8 37.0Z"},"eye"],["rect",{"x":"54.30","y":"34.6","width":"1.4","height":"4.8","rx":"0.70"},"cut"]],"sleep":[["path",{"d":"M16 84C14 70 22 64 25 61C21 55 21 50 24 45L25 30L36 37Q40.5 36 45 37L56 30L57 45C58 47 58.5 49 58.6 51C66 51 78 54 84 62C90 70 90 84 78 84Z"},"fur"],["path",{"d":"M32.0 51.0Q35.0 54.0 38.0 51.0"},"cutline"],["path",{"d":"M43.0 51.0Q46.0 54.0 49.0 51.0"},"cutline"]],"content":[["path",{"d":"M30 86C20 78 19 62 31 53C26 46 26 36 29.5 29L31 10L43.5 20.5Q48 19.2 52.5 20.5L65 10L66.5 29C70 36 70 46 65 53C70 57 72 62 73 67C78 63 82 60 84 54C86 50 90 51 90 55C90 66 84 78 74 84L72 86Z"},"fur"],["path",{"d":"M36.8 37.0Q41.0 35.8 45.2 37.0Q41.0 42.0 36.8 37.0Z"},"eye"],["path",{"d":"M50.8 37.0Q55.0 35.8 59.2 37.0Q55.0 42.0 50.8 37.0Z"},"eye"]]}},"marks":{"line":[["path",{"d":"M32 53C26 47 26 36 29.5 29L31 11L43.5 20.5Q48 19.2 52.5 20.5L65 11L66.5 29C70 36 70 47 64 53Q48 58 32 53Z"},"line"],["path",{"d":"M36.8 37.0Q41.0 31.2 45.2 37.0Q41.0 42.8 36.8 37.0Z"},"eye"],["rect",{"x":"40.30","y":"34.6","width":"1.4","height":"4.8","rx":"0.70"},"cut"],["path",{"d":"M50.8 37.0Q55.0 31.2 59.2 37.0Q55.0 42.8 50.8 37.0Z"},"eye"],["rect",{"x":"54.30","y":"34.6","width":"1.4","height":"4.8","rx":"0.70"},"cut"]],"geometry":[["path",{"d":"M33 32L29 11L46 21Z"},"fur"],["path",{"d":"M63 32L67 11L50 21Z"},"fur"],["circle",{"cx":"48","cy":"36","r":"18"},"fur"],["circle",{"cx":"41","cy":"37","r":"3.6"},"eye"],["rect",{"x":"40.25","y":"34.6","width":"1.5","height":"4.8","rx":"0.75"},"cut"],["circle",{"cx":"55","cy":"37","r":"3.6"},"eye"],["rect",{"x":"54.25","y":"34.6","width":"1.5","height":"4.8","rx":"0.75"},"cut"]],"silhouette":[["path",{"d":"M32 53C26 47 26 36 29.5 29L31 11L43.5 20.5Q48 19.2 52.5 20.5L65 11L66.5 29C70 36 70 47 64 53Q48 58 32 53Z"},"fur"],["path",{"d":"M36.8 37.0Q41.0 31.2 45.2 37.0Q41.0 42.8 36.8 37.0Z"},"eye"],["rect",{"x":"40.30","y":"34.6","width":"1.4","height":"4.8","rx":"0.70"},"cut"],["path",{"d":"M50.8 37.0Q55.0 31.2 59.2 37.0Q55.0 42.8 50.8 37.0Z"},"eye"],["rect",{"x":"54.30","y":"34.6","width":"1.4","height":"4.8","rx":"0.70"},"cut"]]},"vb":"24 6 48 48"};

  function cx() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
  function omit(p, keys) { var o = {}; for (var k in p) if (keys.indexOf(k) < 0) o[k] = p[k]; return o; }
  function cssVar(el, name) { return getComputedStyle(el).getPropertyValue(name).trim(); }
  function ms(v) { return v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000; }

  /* Narrow layout = bp-narrow (640px). Re-renders only when the breakpoint flips, never per key. */
  function useNarrow() {
    var q = '(max-width: 639px)';
    var s = useState(function () { return typeof matchMedia !== 'undefined' && matchMedia(q).matches; });
    useEffect(function () {
      var m = matchMedia(q), f = function () { s[1](m.matches); };
      m.addEventListener('change', f); return function () { m.removeEventListener('change', f); };
    }, []);
    return s[0];
  }

  /* ================= Cat ================= */
  var ROLE = {
    fur: { fill: 'var(--cat-fur)' }, eye: { fill: 'var(--cat-eye)' }, cut: { fill: 'var(--cat-ground)' },
    line: { fill: 'none', stroke: 'var(--cat-fur)', strokeWidth: 'var(--stroke-cat)', strokeLinecap: 'round', strokeLinejoin: 'round' },
    cutline: { fill: 'none', stroke: 'var(--cat-ground)', strokeWidth: 2, strokeLinecap: 'round' },
    gap: { fill: 'none', stroke: 'var(--cat-ground)', strokeWidth: 2.5 }
  };
  function Cat(p) {
    var variant = p.variant || 'geometry', mood = p.mood || 'neutral', size = p.size || 96;
    var els = p.mark ? CAT.marks[variant] : CAT.cats[variant][mood];
    return h('svg', { className: cx('nk-cat', p.className), viewBox: p.mark ? CAT.vb : '0 0 96 96', width: size, height: size,
      role: p.label ? 'img' : undefined, 'aria-label': p.label, 'aria-hidden': p.label ? undefined : true },
      els.map(function (e, i) {
        var props = { key: i, style: ROLE[e[2]] };
        for (var k in e[1]) if (k !== 'fill') props[k] = e[1][k];
        return h(e[0], props);
      }));
  }

  /* ================= Test stream ================= */
  var SKIP = /[\s、。，．・！？!?,.「」『』（）()ー〜…\-]/;
  /* Tokenize words into chars once per prompt. Spaces and punctuation are skip chars: the caret passes them without input. */
  function tokenize(words, mode) {
    var out = [], i = 0;
    words.forEach(function (w, wi) {
      var word = [];
      Array.from(w).forEach(function (ch) { word.push({ ch: ch, i: i++, skip: SKIP.test(ch) && ch !== 'ー' }); });
      if (wi < words.length - 1 && mode !== 'phrase') word.push({ ch: ' ', i: i++, skip: true, space: true });   /* the space rides with its word: a line never starts with it */
      out.push(word);
    });
    return out;
  }

  /*
   * createTestController(root) — framework-free. All per-key work is classList / textContent / transform writes
   * against positions cached after layout; it never reads layout on the hot path and never triggers a component render.
   */
  function createTestController(root, opts) {
    opts = opts || {};
    var inner = root.querySelector('.nk-test__inner');
    var view = root.querySelector('.nk-test__text');
    var chars = Array.prototype.slice.call(root.querySelectorAll('.nk-char'));
    var caret = root.querySelector('.nk-caret');
    var flash = root.querySelector('.nk-caret__reject');
    var buf = root.querySelector('.nk-test__buffer');
    var slot = function (n) { return root.querySelector('[data-slot="' + n + '"]'); };
    var counterEl = slot('counter'), kpmEl = slot('kpm'), accEl = slot('acc');
    var skip = chars.map(function (c) { return c.hasAttribute('data-skip'); });
    var st = chars.map(function () { return 'untyped'; });
    var pos = [], lineH = 0, caretH = 0, viewW = 0, chW = 0, bufLift = 0, cur = 0, shift = 0;
    var lines = opts.lines || 3;
    var reduce = matchMedia('(prefers-reduced-motion: reduce)');
    var rejectMs = ms(cssVar(root, '--dur-reject') || '120ms');

    function measure() {
      if (!chars.length) return;
      pos = chars.map(function (c) { return [c.offsetLeft, c.offsetTop]; });
      lineH = chars[0].offsetHeight;
      var fs = parseFloat(getComputedStyle(inner).fontSize);
      caretH = Math.round(fs * 1.1);
      viewW = view.clientWidth;
      var bfs = parseFloat(getComputedStyle(buf).fontSize);
      chW = bfs * 0.6;                      /* JetBrains Mono advance = 0.6em */
      bufLift = Math.round(parseFloat(getComputedStyle(buf).lineHeight) / 2);
      view.style.height = (lines * lineH + bufLift) + 'px';
      place();
    }
    function line(i) { return pos[i] ? Math.round(pos[i][1] / lineH) : 0; }
    function place() {
      var p = pos[cur] || pos[pos.length - 1];
      if (!p) return;
      var x = cur < pos.length ? p[0] : p[0] + chars[chars.length - 1].offsetWidth;
      var ln = line(Math.min(cur, pos.length - 1));
      if (lines > 1 && ln > shift + lines - 2) shift = ln - (lines - 2);   /* keep the current line second from the bottom */
      if (ln < shift) shift = ln;
      inner.style.transform = 'translateY(' + (-shift * lineH) + 'px)';
      var y = p[1] - shift * lineH;
      caret.style.height = caretH + 'px';
      caret.style.transform = 'translate3d(' + (x - 1) + 'px,' + (y + (lineH - caretH) / 2 + shift * lineH) + 'px,0)';
      var bw = buf.textContent.length * chW;
      var bx = Math.max(0, Math.min(x, viewW - bw));                     /* clamp at the line end */
      buf.style.transform = 'translate3d(' + bx + 'px,' + (p[1] + lineH - bufLift) + 'px,0)';
    }
    function paint(i) {
      var c = chars[i]; if (!c) return;
      c.className = 'nk-char is-' + st[i] + (skip[i] ? ' is-skip' : '');
    }
    var api = {
      /** Mark char i as 'correct' | 'miss' | 'untyped'. Colour switches instantly (no transition). */
      mark: function (i, state) { st[i] = state; paint(i); },
      /** Move the caret to char i; skip chars before it are marked done. */
      moveTo: function (i) {
        cur = i;
        for (var k = i - 1; k >= 0 && skip[k] && st[k] !== 'done'; k--) { st[k] = 'done'; paint(k); }
        place();
      },
      /** Advance past skip chars from i; returns the next typeable index. */
      nextTypeable: function (i) { while (i < chars.length && skip[i]) i++; return i; },
      /** Pending romaji (engine.view() remainder). Never moves text. */
      setBuffer: function (s) { if (buf.textContent !== s) { buf.textContent = s; place(); } },
      /** Rejected key: 120ms miss flash on a separate opacity layer. */
      reject: function () {
        flash.getAnimations().forEach(function (a) { a.cancel(); });
        flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: rejectMs, easing: reduce.matches ? 'step-end' : cssVar(root, '--ease-in') });
      },
      setCounter: function (v) { if (counterEl) counterEl.textContent = v; },
      setLive: function (kpm, acc) { if (kpmEl) kpmEl.textContent = kpm; if (accEl) accEl.textContent = acc; },
      idle: function (on) { caret.classList.toggle('is-idle', !!on); },
      setWindowFocus: function (on) { root.classList.toggle('is-blurred', !on); },
      reset: function () { st = st.map(function () { return 'untyped'; }); chars.forEach(function (_, i) { paint(i); }); cur = 0; shift = 0; buf.textContent = ''; place(); },
      get length() { return chars.length; },
      isSkip: function (i) { return skip[i]; },
      measure: measure,
      destroy: function () { ro.disconnect(); window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus); }
    };
    var ro = new ResizeObserver(measure); ro.observe(view);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    /* Q9: blur only when the window loses focus — focus on Restart or a link does not blur the text. */
    function onBlur() { api.setWindowFocus(false); }
    function onFocus() { api.setWindowFocus(true); }
    window.addEventListener('blur', onBlur); window.addEventListener('focus', onFocus);
    chars.forEach(function (_, i) { paint(i); });
    measure();
    return api;
  }

  var TestArea = forwardRef(function TestArea(p, ref) {
    var narrow = useNarrow();
    var root = useRef(null), ctl = useRef(null);
    var mode = p.mode || 'words';
    var solo = mode === 'kana';
    var typeCls = solo ? (narrow ? 'jp-solo-sm' : 'jp-solo') : (narrow ? 'jp-test-sm' : 'jp-test');
    var lines = p.lines || (narrow ? 2 : 3);
    var key = (p.words || []).join('\u0001') + '|' + mode + '|' + typeCls;
    if (p.onRender) p.onRender();
    useLayoutEffect(function () {
      ctl.current = createTestController(root.current, { lines: lines });
      if (p.onReady) p.onReady(ctl.current);
      return function () { ctl.current.destroy(); };
    }, [key, lines]);
    useImperativeHandle(ref, function () { return { get current() { return ctl.current; } }; }, []);
    var groups = tokenize(p.words || [], mode);
    var L = Object.assign({ kpm: 'kpm', acc: '%', blur: 'вернитесь в окно, чтобы продолжить', repeat: 'повтор' }, p.labels);
    return h('div', { className: cx('nk-test', p.className), ref: root },
      h('div', { className: 'nk-test__bar' },
        h('span', { className: 'nk-test__counter mono-counter', 'data-slot': 'counter' }, p.counter != null ? p.counter : ''),
        p.live !== false && h('span', { className: 'nk-test__live mono-small' },
          h('span', { 'data-slot': 'kpm' }, '0'), ' ' + L.kpm + ' · ', h('span', { 'data-slot': 'acc' }, '100'), L.acc),
        /* repeat mark: static, set once per test by props — no controller method, no per-key work */
        p.repeat && h('span', { className: 'nk-test__repeat mono-small' }, L.repeat)),
      h('div', { className: 'nk-test__text', lang: 'ja' },
        h('div', { className: cx('nk-test__inner', typeCls) },
          groups.map(function (g, gi) {
            return h('span', { key: gi, className: mode === 'phrase' ? 'nk-run' : 'nk-word' }, g.map(function (c) {
              return h('span', { key: c.i, className: 'nk-char is-untyped' + (c.skip ? ' is-skip' : ''), 'data-skip': c.skip ? '' : undefined }, c.space ? ' ' : c.ch);
            }));
          }),
          h('span', { className: 'nk-caret', 'aria-hidden': true }, h('span', { className: 'nk-caret__reject' })),
          h('span', { className: cx('nk-test__buffer', narrow ? 'mono-small' : 'mono-romaji'), 'aria-hidden': true }))),
      h('div', { className: 'nk-test__blur ui-label', 'aria-hidden': true }, L.blur));
  });

  /* Single char for legends and docs (the stream itself uses classList via the controller). */
  function Char(p) {
    var state = p.state || 'untyped';
    return h('span', { className: cx('nk-char', 'is-' + (state === 'current' ? 'untyped' : state), p.skip && 'is-skip') }, p.kana);
  }

  /* ================= Under-stream ================= */
  function TranslationLine(p) {
    var L = Object.assign({ source: 'источник', report: 'сообщить об ошибке', offline: 'доступно только онлайн' }, p.labels);
    return h('div', { className: cx('nk-trans', p.className) },
      h('p', { className: 'nk-trans__text ui-body' }, p.text || ' '),
      h('div', { className: 'nk-trans__actions ui-caption' },
        p.sourceHref && h('a', { className: 'nk-link', href: p.sourceHref, target: '_blank', rel: 'noopener' }, L.source),
        h('button', { type: 'button', className: 'nk-link', disabled: p.offline, title: p.offline ? L.offline : undefined, onClick: p.onReport }, L.report)));
  }

  function Notice(p) {
    return h('div', { className: cx('nk-notice', p.mono ? 'mono-romaji' : 'ui-label', p.tone === 'miss' && 'is-miss', p.reserve && 'is-reserved', p.className),
      role: p.role || 'status', 'aria-live': 'polite' },
      p.children, p.action && h('span', { className: 'nk-notice__action' }, p.action));
  }

  function Kbd(p) { return h('kbd', { className: cx('nk-kbd', 'mono-small', p.bare && 'is-bare', p.className) }, p.children); }

  /* ================= Buttons & inputs ================= */
  function Button(p) {
    var variant = p.variant || 'secondary', size = p.size || 'md';
    var rest = omit(p, ['variant', 'size', 'hint', 'className', 'children']);
    rest.className = cx('nk-btn', 'nk-btn--' + variant, 'nk-btn--' + size, 'ui-label', p.className);
    rest.type = p.type || 'button';
    return h('button', rest, p.children, p.hint && h(Kbd, { bare: true }, p.hint));
  }

  function Segmented(p) {
    var opts = p.options || [];
    var st = useState(p.defaultValue != null ? p.defaultValue : (opts[0] && opts[0].value));
    var value = p.value != null ? p.value : st[0];
    function pick(v) { if (p.value == null) st[1](v); if (p.onChange) p.onChange(v); }
    function key(e, i) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); var j = (i + d + opts.length) % opts.length; pick(opts[j].value);
      var sib = e.currentTarget.parentNode.children[j]; if (sib) sib.focus();
    }
    return h('div', { className: cx('nk-seg', p.className), role: 'radiogroup', 'aria-label': p.label },
      opts.map(function (o, i) {
        var on = o.value === value;
        return h('button', { key: String(o.value), type: 'button', role: 'radio', 'aria-checked': on, tabIndex: on ? 0 : -1, disabled: o.disabled,
          className: cx('nk-seg__item', p.mono ? 'mono-romaji' : 'ui-label', on && 'is-on'),
          onClick: function () { pick(o.value); }, onKeyDown: function (e) { key(e, i); } }, o.label);
      }));
  }

  function Toggle(p) {
    return h('button', { type: 'button', 'aria-pressed': !!p.pressed, className: cx('nk-seg__item', 'ui-label', p.pressed && 'is-on'), onClick: function () { p.onChange && p.onChange(!p.pressed); } }, p.children);
  }

  function Switch(p) {
    var st = useState(!!p.defaultChecked);
    var on = p.checked != null ? p.checked : st[0];
    var id = useId();
    function toggle() { if (p.disabled) return; if (p.checked == null) st[1](!on); if (p.onChange) p.onChange(!on); }
    return h('div', { className: cx('nk-switch', p.disabled && 'is-disabled', p.className) },
      h('label', { htmlFor: id, className: 'nk-switch__label ui-label' }, p.label,
        p.description && h('span', { className: 'nk-switch__desc ui-caption' }, p.description)),
      h('button', { id: id, type: 'button', role: 'switch', 'aria-checked': on, disabled: p.disabled, className: cx('nk-switch__track', on && 'is-on'), onClick: toggle },
        h('span', { className: 'nk-switch__knob' })));
  }

  function Field(p, control, id) {
    return h('div', { className: cx('nk-input', p.error && 'is-error', p.className) },
      p.label && h('label', { htmlFor: id, className: 'nk-input__label ui-caption' }, p.label),
      control,
      (p.error || p.hint) && h('div', { id: id + '-m', className: 'nk-input__msg ui-caption' }, p.error || p.hint));
  }
  function fieldProps(p, id, cls) {
    var rest = omit(p, ['label', 'hint', 'error', 'mono', 'className', 'options', 'counter']);
    rest.id = id; rest.className = cls;
    if (p.error) rest['aria-invalid'] = true;
    if (p.error || p.hint) rest['aria-describedby'] = id + '-m';
    return rest;
  }
  function Input(p) { var id = useId(); return Field(p, h('input', fieldProps(p, id, cx('nk-input__field', p.mono ? 'mono-romaji' : 'ui-body'))), id); }
  function Textarea(p) { var id = useId(); return Field(p, h('textarea', fieldProps(p, id, 'nk-input__field nk-input__area ui-body')), id); }
  function Select(p) {
    var id = useId();
    return Field(p, h('span', { id: id + '-w', className: 'nk-select' },
      h('select', fieldProps(p, id, 'nk-input__field nk-select__field ui-body'),
        (p.options || []).map(function (o) { return h('option', { key: o.value, value: o.value, disabled: o.disabled }, o.label); })),
      h('span', { className: 'nk-select__arrow', 'aria-hidden': true })), id);
  }

  function Tooltip(p) {
    var st = useState(false);
    var open = p.open != null ? p.open : st[0];
    var id = useId();
    var child = React.Children.only(p.children);
    var trigger = React.cloneElement(child, { 'aria-describedby': id,
      onMouseEnter: function () { st[1](true); }, onMouseLeave: function () { st[1](false); },
      onFocus: function () { st[1](true); }, onBlur: function () { st[1](false); } });
    return h('span', { className: cx('nk-tip', 'nk-tip--' + (p.side || 'top'), open && 'is-open') },
      trigger, h('span', { role: 'tooltip', id: id, className: 'nk-tip__bubble ui-caption' }, p.label));
  }

  /* ================= Dialog ================= */
  function Dialog(p) {
    var ref = useRef(null), tid = useId();
    useEffect(function () {
      var d = ref.current; if (!d) return;
      if (p.open && !d.open) {
        if (p.inline) d.show(); else d.showModal();
        /* initial focus: the first action — put the safe one (cancel) first in `actions` */
        var first = d.querySelector('.nk-dialog__actions button:not(:disabled)'); if (first) first.focus();
      }
      if (!p.open && d.open) d.close();
    }, [p.open]);
    return h('dialog', { ref: ref, className: cx('nk-dialog', p.inline && 'is-inline', p.className), 'aria-labelledby': tid,
      onCancel: function (e) { e.preventDefault(); p.onClose && p.onClose(); } },
      h('div', { className: 'nk-dialog__head' }, h('h2', { id: tid, className: 'nk-dialog__title ui-heading' }, p.title)),
      h('div', { className: 'nk-dialog__body ui-body' }, p.children),
      p.actions && h('div', { className: 'nk-dialog__actions' }, p.actions));
  }

  /* ================= Kana data =================
   * Mirrors packages/engine RowId and docs/spec/learning.md: hiragana 26 groups, katakana 31.
   * cells: hiragana in table order, null = gap (basic and dakuten rows are aligned to a·i·u·e·o).
   * Extended rows exist in katakana only (`kata`). */
  var ROWS = [
    ['base', 'vowels', '', ['あ', 'い', 'う', 'え', 'お']], ['base', 'k', 'k', ['か', 'き', 'く', 'け', 'こ']], ['base', 's', 's', ['さ', 'し', 'す', 'せ', 'そ']],
    ['base', 't', 't', ['た', 'ち', 'つ', 'て', 'と']], ['base', 'n', 'n', ['な', 'に', 'ぬ', 'ね', 'の']], ['base', 'h', 'h', ['は', 'ひ', 'ふ', 'へ', 'ほ']],
    ['base', 'm', 'm', ['ま', 'み', 'む', 'め', 'も']], ['base', 'y', 'y', ['や', null, 'ゆ', null, 'よ']], ['base', 'r', 'r', ['ら', 'り', 'る', 'れ', 'ろ']],
    ['base', 'w_n', 'w·n', ['わ', 'を', 'ん']],
    ['voiced', 'g', 'g', ['が', 'ぎ', 'ぐ', 'げ', 'ご']], ['voiced', 'z', 'z', ['ざ', 'じ', 'ず', 'ぜ', 'ぞ']], ['voiced', 'd', 'd', ['だ', 'ぢ', 'づ', 'で', 'ど']],
    ['voiced', 'b', 'b', ['ば', 'び', 'ぶ', 'べ', 'ぼ']], ['voiced', 'p', 'p', ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']],
    ['combo', 'ky', 'ky', ['きゃ', 'きゅ', 'きょ']], ['combo', 'sh', 'sh', ['しゃ', 'しゅ', 'しょ']], ['combo', 'ch', 'ch', ['ちゃ', 'ちゅ', 'ちょ']],
    ['combo', 'ny', 'ny', ['にゃ', 'にゅ', 'にょ']], ['combo', 'hy', 'hy', ['ひゃ', 'ひゅ', 'ひょ']], ['combo', 'my', 'my', ['みゃ', 'みゅ', 'みょ']],
    ['combo', 'ry', 'ry', ['りゃ', 'りゅ', 'りょ']], ['combo', 'gy', 'gy', ['ぎゃ', 'ぎゅ', 'ぎょ']], ['combo', 'j', 'j', ['じゃ', 'じゅ', 'じょ']],
    ['combo', 'by', 'by', ['びゃ', 'びゅ', 'びょ']], ['combo', 'py', 'py', ['ぴゃ', 'ぴゅ', 'ぴょ']],
    ['ext', 'ext_fa', 'f', null, ['ファ', 'フィ', 'フェ', 'フォ']], ['ext', 'ext_va', 'v', null, ['ヴァ', 'ヴィ', 'ヴ', 'ヴェ', 'ヴォ']],
    ['ext', 'ext_wi', 'w', null, ['ウィ', 'ウェ', 'ウォ']], ['ext', 'ext_ti', 't·d', null, ['ティ', 'トゥ', 'ディ', 'ドゥ', 'テュ', 'デュ']],
    ['ext', 'ext_che', 'e', null, ['シェ', 'ジェ', 'チェ']]
  ].map(function (r) { return { group: r[0], id: r[1], head: r[2], hira: r[3], kata: r[4] || r[3].map(function (c) { return c && toKata(c); }) }; });
  var GROUPS = ['base', 'voiced', 'combo', 'ext'];
  function toKata(s) { return s.replace(/[ぁ-ゖ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) + 0x60); }); }
  /** Rows of a script in table order: hiragana 26, katakana 31 ('both' = katakana's 31). */
  function rowsFor(script) { return ROWS.filter(function (r) { return script === 'hiragana' ? !!r.hira : true; }); }
  function cellsOf(r, script) { return script === 'hiragana' ? r.hira : r.kata; }
  /** Every kana of a track (gaps removed): hiragana 104, katakana 125. */
  function kanaOf(script) { var out = []; rowsFor(script).forEach(function (r) { cellsOf(r, script).forEach(function (c) { if (c) out.push(c); }); }); return out; }

  /* ================= RowPicker ================= */
  function RowPicker(p) {
    var L = Object.assign({ base: 'основные', voiced: 'звонкие', combo: 'сочетания', ext: 'расширенные (только катакана)', all: 'все', none: 'снять',
      count: function (n) { return 'выбрано рядов: ' + n; }, empty: 'Ни одного ряда — тест возьмёт базовые ряды' }, p.labels);
    var script = p.script || 'hiragana', showScript = script === 'hiragana' ? 'hiragana' : 'katakana';
    var rows = rowsFor(script), visible = rows.map(function (r) { return r.id; });
    var sel = p.value || [];
    /* Extended ids stay stored when the script switches to hiragana, but they yield no kana there: count only rows that do. */
    var counted = sel.filter(function (id) { return visible.indexOf(id) >= 0; });
    function set(next) { p.onChange && p.onChange(next); }
    function toggle(id) { set(sel.indexOf(id) >= 0 ? sel.filter(function (x) { return x !== id; }) : sel.concat(id)); }
    return h('div', { className: 'nk-rows' },
      GROUPS.map(function (g) {
        var gr = rows.filter(function (r) { return r.group === g; }); if (!gr.length) return null;
        var ids = gr.map(function (r) { return r.id; });
        return h('fieldset', { key: g, className: 'nk-rows__group' },
          h('legend', { className: 'nk-rows__legend' },
            h('span', { className: 'ui-caption' }, L[g]),
            h('button', { type: 'button', className: 'nk-link ui-caption', onClick: function () { set(sel.filter(function (x) { return ids.indexOf(x) < 0; }).concat(ids)); } }, L.all),
            h('button', { type: 'button', className: 'nk-link ui-caption', onClick: function () { set(sel.filter(function (x) { return ids.indexOf(x) < 0; })); } }, L.none)),
          h('div', { className: 'nk-rows__grid' }, gr.map(function (r) {
            var on = sel.indexOf(r.id) >= 0;
            return h('button', { key: r.id, type: 'button', role: 'checkbox', 'aria-checked': on, className: cx('nk-check', on && 'is-on'), onClick: function () { toggle(r.id); } },
              h('span', { className: 'nk-check__box', 'aria-hidden': true }),
              h('span', { className: 'nk-check__kana jp-body', lang: 'ja' }, cellsOf(r, showScript).filter(Boolean).join(' ')),
              h('span', { className: 'nk-check__id mono-small' }, r.id));
          })));
      }),
      h('div', { className: 'nk-rows__foot' },
        counted.length ? h('span', { className: 'ui-caption nk-dim' }, L.count(counted.length)) : h(Notice, null, L.empty)));
  }

  /* ================= ModePanel ================= */
  var MODE_LABELS = {
    ru: { script: 'письмо', hiragana: 'хирагана', katakana: 'катакана', both: 'обе', content: 'материал', kana: 'кана', words: 'слова', phrases: 'фразы',
      strict: 'строгость', relaxed: 'мягкая', strictIme: 'строгая IME', type: 'тест', time: 'время', count: 'количество', zen: 'zen', amount: 'длина',
      weak: 'слабые каны', rows: 'ряды' },
    en: { script: 'script', hiragana: 'hiragana', katakana: 'katakana', both: 'both', content: 'content', kana: 'kana', words: 'words', phrases: 'phrases',
      strict: 'strictness', relaxed: 'relaxed', strictIme: 'strict IME', type: 'test', time: 'time', count: 'count', zen: 'zen', amount: 'length',
      weak: 'weak focus', rows: 'rows' }
  };
  function ModePanel(p) {
    var T = Object.assign({}, MODE_LABELS[p.lang || 'ru'], p.labels);
    var v = Object.assign({ script: 'hiragana', content: 'words', strict: 'learner', type: 'time', amount: 30, weakFocus: false, rows: 7 }, p.value);
    function set(k) { return function (x) { var n = Object.assign({}, v); n[k] = x; if (k === 'type') n.amount = x === 'time' ? 30 : 25; p.onChange && p.onChange(n); }; }
    function group(id, label, node) { return h('div', { key: id, className: 'nk-modes__group' }, label && h('span', { className: 'nk-modes__label ui-caption' }, label), node); }
    var amounts = v.type === 'time' ? [15, 30, 60, 120] : [10, 25, 50, 100];
    return h('div', { className: cx('nk-modes', p.className) },
      h('div', { className: 'nk-modes__row' },
        group('script', T.script, h(Segmented, { label: T.script, value: v.script, onChange: set('script'), options: [{ value: 'hiragana', label: T.hiragana }, { value: 'katakana', label: T.katakana }, { value: 'both', label: T.both }] })),
        group('content', T.content, h(Segmented, { label: T.content, value: v.content, onChange: set('content'), options: [{ value: 'kana', label: T.kana }, { value: 'words', label: T.words }, { value: 'phrases', label: T.phrases }] })),
        group('strict', T.strict, h(Segmented, { label: T.strict, value: v.strict, onChange: set('strict'), options: [{ value: 'learner', label: T.relaxed }, { value: 'ime', label: T.strictIme }] }))),
      h('div', { className: 'nk-modes__row' },
        group('type', T.type, h(Segmented, { label: T.type, value: v.type, onChange: set('type'), options: [{ value: 'time', label: T.time }, { value: 'count', label: T.count }, { value: 'zen', label: T.zen }] })),
        v.type !== 'zen' && group('amount', T.amount, h(Segmented, { label: T.amount, mono: true, value: v.amount, onChange: set('amount'), options: amounts.map(function (a) { return { value: a, label: String(a) }; }) })),
        group('weak', null, h('div', { className: 'nk-seg' }, h(Toggle, { pressed: v.weakFocus, onChange: set('weakFocus') }, T.weak))),
        v.content === 'kana' && group('rows', null, h('div', { className: 'nk-seg' },
          h('button', { type: 'button', className: 'nk-seg__item ui-label', 'aria-haspopup': 'dialog', onClick: p.onRows }, T.rows + ' · ', h('span', { className: 'mono-romaji' }, v.rows), ' …')))));
  }

  /* ================= Results ================= */
  function Stat(p) {
    var narrow = useNarrow();
    var hero = p.size === 'hero';
    return h('div', { className: cx('nk-stat', hero && 'nk-stat--hero', p.className) },
      h('div', { className: 'nk-stat__label ui-caption' }, p.label, p.badge),
      h('div', { className: 'nk-stat__value' },
        h('span', { className: hero ? (narrow ? 'mono-hero-sm' : 'mono-hero') : 'mono-stat' }, p.value),
        p.unit && h('span', { className: 'nk-stat__unit mono-romaji' }, p.unit)),
      p.note && h('div', { className: 'nk-stat__note ui-caption' }, p.note));
  }

  function PersonalBestBadge(p) { return h('span', { className: 'nk-badge ui-caption' }, p.children || 'личный рекорд'); }

  function ResultChart(p) {
    var fig = useRef(null), ws = useState(0);   /* measured: the chart draws at its real width, so axis text never scales */
    useLayoutEffect(function () {
      var ro = new ResizeObserver(function (e) { var w = Math.round(e[0].contentRect.width); if (w) ws[1](w); });
      ro.observe(fig.current); return function () { ro.disconnect(); };
    }, []);
    var W = ws[0], H = p.height || 160, padL = 36, padB = 20, padT = 8;
    var vals = p.values || [];
    var n = Math.max(vals.length, 2);
    var top = Math.ceil(Math.max.apply(null, vals.concat([10])) / 50) * 50;
    var ix = function (i) { return padL + (i / (n - 1)) * (W - padL - 4); };
    var iy = function (v) { return padT + (1 - v / top) * (H - padT - padB); };
    var hov = useState(null);
    var show = p.cursor != null ? p.cursor : hov[0];
    var unit = p.xUnit != null ? p.xUnit : ' c';
    var tip = p.tip || function (i, v) { return (i + 1) + unit + ' · ' + v + ' kpm'; };
    function move(e) {
      var r = e.currentTarget.getBoundingClientRect();
      var i = Math.round(((e.clientX - r.left) * (W / r.width) - padL) / (W - padL - 4) * (n - 1));
      hov[1](Math.max(0, Math.min(n - 1, i)));
    }
    function key(e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
      e.preventDefault(); hov[1](Math.max(0, Math.min(n - 1, (show == null ? -1 : show) + d)));
    }
    return h('figure', { className: cx('nk-chart', p.className), ref: fig, style: { minHeight: H } },
      W > 0 && h('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', tabIndex: 0, 'aria-label': p.label || 'KPM по секундам',
        onMouseMove: move, onMouseLeave: function () { hov[1](null); }, onKeyDown: key, onBlur: function () { hov[1](null); } },
        [0, top / 2, top].map(function (t) {
          return h('g', { key: t }, h('line', { className: 'nk-chart__grid', x1: padL, x2: W, y1: iy(t), y2: iy(t) }),
            h('text', { className: 'nk-chart__axis mono-small', x: padL - 8, y: iy(t) + 4, textAnchor: 'end' }, t));
        }),
        [0, Math.floor((n - 1) / 2), n - 1].map(function (i) {
          return h('text', { key: 'x' + i, className: 'nk-chart__axis mono-small', x: ix(i), y: H - 4, textAnchor: i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle' }, (i + 1) + (i === n - 1 ? unit : ''));
        }),
        h('polyline', { className: 'nk-chart__line', points: vals.map(function (v, i) { return ix(i).toFixed(1) + ',' + iy(v).toFixed(1); }).join(' '), pathLength: 1 }),
        show != null && h('line', { className: 'nk-chart__cursor', x1: ix(show), x2: ix(show), y1: padT, y2: H - padB })),
      W > 0 && show != null && h('figcaption', { className: 'nk-chart__tip mono-small', style: { left: (ix(show) / W * 100) + '%' } }, tip(show, vals[show])));
  }

  function WeakKanaList(p) {
    var L = Object.assign({ kana: 'кана', time: 'реакция', typed: 'написания', misses: 'ошибки', ms: 'мс' }, p.labels);
    return h('table', { className: 'nk-weak' },
      h('thead', null, h('tr', { className: 'ui-caption' }, h('th', null, L.kana), h('th', null, L.typed), h('th', { className: 'num' }, L.time), h('th', { className: 'num' }, L.misses))),
      h('tbody', null, (p.items || []).map(function (it) {
        return h('tr', { key: it.kana },
          h('td', { className: 'jp-cell', lang: 'ja' }, it.kana),
          h('td', { className: 'mono-small nk-dim' }, it.spellings.join(' · ')),
          h('td', { className: 'num mono-romaji' }, it.ms, h('span', { className: 'nk-dim mono-small' }, ' ' + L.ms)),
          h('td', { className: 'num mono-romaji' }, it.misses));
      })));
  }

  /* ================= KanaChart ================= */
  function stepFor(mode, v) {
    if (v == null) return null;
    if (mode === 'miss') { var t = [0, 0.03, 0.07, 0.12, 0.2]; if (v <= 0) return 0; for (var i = 4; i >= 0; i--) if (v > t[i]) return i + 1; return 1; }
    if (mode === 'time') { var u = [0, 450, 600, 750, 950]; for (var j = 4; j >= 0; j--) if (v >= u[j]) return j + 1; return 1; }
    return v;
  }
  function KanaChart(p) {
    var mode = p.mode || 'miss', script = p.script || 'hiragana', data = p.data || {};
    var L = Object.assign({ base: 'основные', voiced: 'звонкие', combo: 'сочетания', ext: 'расширенные', none: 'нет данных', locked: 'заблокирована', fresh: 'не введена',
      box0: 'бокс 0', box: 'бокс', mastered: 'освоена', missFmt: function (v, n) { return 'ошибок ' + Math.round(v * 100) + '% · попыток ' + n; }, timeFmt: function (v) { return 'реакция ' + v + ' мс'; },
      lowMiss: 'меньше ошибок', highMiss: 'больше ошибок', fast: 'быстрее', slow: 'медленнее' }, p.labels);
    var act = useState(null), active = act[0];
    var grid = useRef(null);
    var rows = rowsFor(script), first = cellsOf(rows[0], script)[0];
    function describe(k) {
      var d = data[k];
      if (mode === 'box') { if (d === 'locked') return L.locked; if (d == null || d === 'new') return L.fresh; return d === 0 ? L.box0 : L.box + ' ' + d + (d >= 4 ? ' · ' + L.mastered : ''); }
      if (d == null) return L.none;
      return mode === 'miss' ? L.missFmt(d.v, d.n) : L.timeFmt(d.v);
    }
    function cellCls(k) {
      var d = data[k];
      if (mode === 'box') {
        if (d === 'locked') return 'is-locked'; if (d == null || d === 'new') return 'is-empty';
        if (d === 0) return 'is-box0'; return 'is-fur-' + d + (d >= 4 ? ' is-mastered' : '');
      }
      if (d == null) return 'is-empty';
      var s = stepFor(mode, d.v); if (!s) return 'is-zero';
      return (mode === 'miss' ? 'is-miss-' : 'is-fur-') + s;
    }
    /* Arrows: ← → along the row (then the next row), ↑ ↓ to the nearest column of the row above / below, across blocks. */
    function nav(e) {
      var d = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key]; if (!d) return;
      var el = document.activeElement; if (!el || !el.hasAttribute('data-k')) return;
      e.preventDefault();
      var all = Array.prototype.slice.call(grid.current.querySelectorAll('[data-k]'));
      var target;
      if (d[1]) target = all[all.indexOf(el) + d[1]];
      else {
        var r = +el.getAttribute('data-r') + d[0], c = +el.getAttribute('data-c');
        var line = all.filter(function (x) { return +x.getAttribute('data-r') === r; });
        line.sort(function (a, b) { return Math.abs(+a.getAttribute('data-c') - c) - Math.abs(+b.getAttribute('data-c') - c); });
        target = line[0];
      }
      if (target) target.focus();
    }
    var ri = 0;
    function block(g) {
      var gr = rows.filter(function (r) { return r.group === g; }); if (!gr.length) return null;
      return h('div', { className: cx('nk-kc__block', 'nk-kc__block--' + g), role: 'rowgroup', key: g },
        h('div', { className: 'nk-kc__caption ui-caption' }, L[g]),
        gr.map(function (r) {
          var rIndex = ri++;
          return h('div', { className: 'nk-kc__row', role: 'row', key: r.id },
            h('span', { className: 'nk-kc__head mono-small', role: 'rowheader', 'aria-label': r.id }, r.head),
            cellsOf(r, script).map(function (k, ci) {
              if (!k) return h('span', { key: ci, className: 'nk-kc__gap', role: 'gridcell' });
              var desc = describe(k);
              return h('button', { key: ci, type: 'button', role: 'gridcell', 'data-k': k, 'data-r': rIndex, 'data-c': ci, lang: 'ja', 'aria-label': k + ' — ' + desc,
                'aria-disabled': data[k] === 'locked' || undefined, tabIndex: active === k || (!active && k === first) ? 0 : -1,
                className: cx('nk-kc__cell', k.length > 1 ? 'jp-cell-sm' : 'jp-cell', cellCls(k), active === k && 'is-active'),
                onFocus: function () { act[1](k); }, onMouseEnter: function () { act[1](k); }, onClick: function () { p.onSelect && p.onSelect(k); } },
                k, active === k && h('span', { className: 'nk-kc__tip ui-caption', role: 'tooltip' }, desc));
            }));
        }));
    }
    var steps = mode === 'miss' ? 'miss' : 'fur';
    return h('div', { className: cx('nk-kc', p.className) },
      h('div', { className: 'nk-kc__grid', role: 'grid', 'aria-label': p.label, ref: grid, onKeyDown: nav, onMouseLeave: function () { act[1](null); } },
        GROUPS.map(block)),
      h('div', { className: 'nk-kc__legend ui-caption' },
        mode !== 'box' && h('span', null, mode === 'miss' ? L.lowMiss : L.fast),
        [1, 2, 3, 4, 5].map(function (s) { return h('span', { key: s, className: 'nk-kc__sw mono-small is-' + steps + '-' + s + (mode === 'box' && s >= 4 ? ' is-mastered' : '') }, mode === 'box' ? s : ''); }),
        mode !== 'box' && h('span', null, mode === 'miss' ? L.highMiss : L.slow),
        mode === 'box'
          ? [h('span', { key: 'b0', className: 'nk-kc__sw mono-small is-box0' }, '0'), h('span', { key: 'n', className: 'nk-kc__sw mono-small is-empty' }), h('span', { key: 'nl' }, L.fresh), h('span', { key: 'l', className: 'nk-kc__sw jp-body is-locked' }, script === 'hiragana' ? 'あ' : 'ア'), h('span', { key: 'll' }, L.locked)]
          : [h('span', { key: 'e', className: 'nk-kc__sw mono-small is-empty' }), h('span', { key: 'el' }, L.none)]));
  }

  /* ================= History ================= */
  function HistoryTable(p) {
    var L = Object.assign({ date: 'дата', mode: 'режим', kpm: 'kpm', acc: 'точность', time: 'время', loading: 'загружаем историю…' }, p.labels);
    return h('div', { className: 'nk-hist' },
      h('table', { className: 'nk-hist__table' },
        h('thead', null, h('tr', { className: 'ui-caption' }, h('th', null, L.date), h('th', null, L.mode), h('th', { className: 'num' }, L.kpm), h('th', { className: 'num' }, L.acc), h('th', { className: 'num' }, L.time))),
        h('tbody', null, (p.rows || []).map(function (r, i) {
          return h('tr', { key: i },
            h('td', { className: 'mono-small nk-dim', 'data-l': L.date }, r.date),
            h('td', { className: 'ui-label', 'data-l': L.mode }, r.mode, r.best && h(PersonalBestBadge, null, p.bestLabel)),
            h('td', { className: 'num mono-romaji', 'data-l': L.kpm }, r.kpm),
            h('td', { className: 'num mono-romaji', 'data-l': L.acc }, r.acc + '%'),
            h('td', { className: 'num mono-romaji nk-dim', 'data-l': L.time }, r.time));
        }))),
      p.loading && h(Notice, null, L.loading));
  }

  function Pagination(p) {
    var L = Object.assign({ prev: '← назад', next: 'вперёд →', label: 'страницы истории' }, p.labels);
    var page = p.page || 1, pages = p.pages || 1;
    var list = [];
    for (var i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) list.push(i); else if (list[list.length - 1] !== '…') list.push('…');
    function go(n) { p.onPage && p.onPage(n); }
    return h('nav', { className: 'nk-pages', 'aria-label': L.label },
      h('button', { type: 'button', className: 'nk-seg__item ui-label', disabled: page <= 1, onClick: function () { go(page - 1); } }, L.prev),
      list.map(function (n, i) {
        return n === '…' ? h('span', { key: 'g' + i, className: 'nk-dim mono-romaji' }, '…')
          : h('button', { key: n, type: 'button', className: cx('nk-seg__item mono-romaji', n === page && 'is-on'), 'aria-current': n === page ? 'page' : undefined, onClick: function () { go(n); } }, n);
      }),
      h('button', { type: 'button', className: 'nk-seg__item ui-label', disabled: page >= pages, onClick: function () { go(page + 1); } }, L.next));
  }

  /* ================= Lesson ================= */
  function OptionCard(p) {
    var state = p.state || 'idle';
    return h('button', { type: 'button', className: cx('nk-opt', 'is-' + state), disabled: p.disabled, onClick: p.onClick,
      'aria-label': p.ariaLabel, 'aria-pressed': state === 'correct' || state === 'wrong' ? true : undefined },
      h(Kbd, null, p.n),
      h('span', { className: cx('nk-opt__label', p.kana ? 'jp-test-sm' : 'mono-stat'), lang: p.kana ? 'ja' : undefined }, p.children));
  }

  function VerticalLabel(p) { return h('span', { className: cx('nk-vlabel', 'jp-vertical', p.className), lang: 'ja', role: 'img', 'aria-label': p.ariaLabel }, p.children); }

  /* ================= Nav & footer ================= */
  function Nav(p) {
    var ref = useRef(null);
    useEffect(function () { var n = ref.current; if (!n) return; if (p.hidden) n.setAttribute('inert', ''); else n.removeAttribute('inert'); }, [p.hidden]);
    var items = p.items || [];
    return h('header', { ref: ref, className: cx('nk-nav', p.hidden && 'is-hidden', p.className) },
      h('a', { className: 'nk-nav__brand', href: p.homeHref || '#', 'aria-label': p.homeLabel || 'Nekotype' },
        h(Cat, { mark: true, variant: 'geometry', size: 28 }), h('span', { className: 'nk-nav__word' }, 'nekotype')),
      h('nav', { className: 'nk-nav__links', 'aria-label': p.label },
        items.map(function (it) {
          return h('a', { key: it.id, href: it.href || '#', className: cx('nk-nav__link', 'ui-label', it.id === p.active && 'is-active'), 'aria-current': it.id === p.active ? 'page' : undefined,
            onClick: p.onNavigate ? function (e) { e.preventDefault(); p.onNavigate(it.id); } : undefined }, it.label);
        })),
      h('div', { className: 'nk-nav__side' },
        h('div', { className: 'nk-lang', role: 'group', 'aria-label': p.langLabel || 'язык' }, ['en', 'ru'].map(function (l) {
          return h('button', { key: l, type: 'button', lang: l, className: cx('nk-lang__btn mono-small', p.lang === l && 'is-on'), 'aria-pressed': p.lang === l, onClick: function () { p.onLang && p.onLang(l); } }, l);
        })),
        p.loginLabel && h('a', { href: p.loginHref || '#', className: cx('nk-nav__link ui-label', p.active === 'login' && 'is-active'),
          onClick: p.onNavigate ? function (e) { e.preventDefault(); p.onNavigate('settings'); } : undefined }, p.loginLabel)));
  }

  function Footer(p) {
    var ref = useRef(null);
    useEffect(function () { var n = ref.current; if (!n) return; if (p.hidden) n.setAttribute('inert', ''); else n.removeAttribute('inert'); }, [p.hidden]);
    return h('footer', { ref: ref, className: cx('nk-foot', p.hidden && 'is-hidden') },
      (p.links || []).map(function (l) { return h('a', { key: l.id, href: l.href || '#', className: 'nk-link ui-caption', onClick: l.onClick }, l.label); }));
  }

  /* ================= Empty state ================= */
  function EmptyState(p) {
    return h('div', { className: cx('nk-empty', p.className) },
      h(Cat, { variant: 'geometry', mood: p.mood || 'sleep', size: p.size || 112 }),
      h('div', { className: 'nk-empty__title ui-heading' }, p.title),
      p.text && h('p', { className: 'nk-empty__text ui-body' }, p.text),
      p.action);
  }

  var C = window;
  C.Nekotype = Object.assign(C.Nekotype || {}, {
    TestArea: TestArea, Char: Char, TranslationLine: TranslationLine, Notice: Notice, Kbd: Kbd, ModePanel: ModePanel, RowPicker: RowPicker, Dialog: Dialog,
    Button: Button, Segmented: Segmented, Switch: Switch, Input: Input, Textarea: Textarea, Select: Select, Tooltip: Tooltip,
    Stat: Stat, PersonalBestBadge: PersonalBestBadge, ResultChart: ResultChart, WeakKanaList: WeakKanaList, KanaChart: KanaChart,
    HistoryTable: HistoryTable, Pagination: Pagination, OptionCard: OptionCard, VerticalLabel: VerticalLabel, Nav: Nav, Footer: Footer,
    Cat: Cat, EmptyState: EmptyState,
    /* not components: */ createTestController: createTestController, useNarrow: useNarrow, MODE_LABELS: MODE_LABELS, KANA_ROWS: ROWS, kanaRows: rowsFor, kanaOf: kanaOf
  });
})();
