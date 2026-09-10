// Mobile nav toggle
document.addEventListener('click', function (e) {
  const toggle = e.target.closest('.nav-toggle');
  if (toggle) {
    const links = document.querySelector('.nav-links');
    const open = links?.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
});

// Scroll-reveal: gentle fade-and-rise as content enters the viewport.
// Motion principles (motion-framer): transform+opacity only, ~450ms ease-out,
// staggered within a group, and fully skipped when the user prefers reduced motion.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  var selectors = [
    '.section-head', '.card', '.threen .nbox', '.pub',
    '.award', '.person', '.split > *', '.cta-band',
    '.stats .stat', '.contact-card', '.timeline .tl-item'
  ];
  var els = [];
  document.querySelectorAll(selectors.join(',')).forEach(function (el) { els.push(el); });
  if (!els.length) return;

  // Stagger items that share a direct parent (e.g. cards in a grid).
  var counts = new Map();
  els.forEach(function (el) {
    el.classList.add('reveal');
    var p = el.parentElement;
    var n = counts.get(p) || 0;
    el.style.transitionDelay = Math.min(n * 70, 280) + 'ms';
    counts.set(p, n + 1);
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  els.forEach(function (el) { io.observe(el); });
})();

// Shared reduced-motion flag
var PREFERS_REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Animated stat counters (home) ----------
(function () {
  var nums = document.querySelectorAll('.stats .num span');
  if (!nums.length) return;

  function parse(txt) {
    var m = String(txt).trim().match(/^(\d+)(.*)$/);
    return m ? { target: +m[1], suffix: m[2] || '' } : null;
  }
  function run(el) {
    var info = parse(el.textContent);
    if (!info || PREFERS_REDUCE) return; // leave final value in place
    var dur = 1100, start = null, from = 0;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = Math.round(from + (info.target - from) * eased) + info.suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    el.textContent = '0' + info.suffix;
    requestAnimationFrame(tick);
  }
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  nums.forEach(function (n) { io.observe(n); });
})();

// ---------- Interactive 3N diagram (research) ----------
(function () {
  var viz = document.getElementById('threenViz');
  if (!viz) return;
  var detail = document.getElementById('threenDetail');
  var tpl = document.getElementById('threenCopy');
  var defaultHTML = detail.innerHTML;
  var copies = {};
  if (tpl) tpl.content.querySelectorAll('p').forEach(function (p) { copies[p.getAttribute('data-n')] = p.outerHTML; });

  function light(n) {
    viz.classList.remove('lit-1', 'lit-2', 'lit-3');
    if (n) { viz.classList.add('lit-' + n); detail.innerHTML = copies[n] ? '<p class="threen-caption" style="max-width:60ch;margin-inline:auto;">' + copies[n].replace(/^<p[^>]*>|<\/p>$/g, '') + '</p>' : defaultHTML; }
    else { detail.innerHTML = defaultHTML; }
  }
  viz.querySelectorAll('.n-node').forEach(function (node) {
    var n = node.getAttribute('data-n');
    node.addEventListener('mouseenter', function () { light(n); });
    node.addEventListener('focus', function () { light(n); });
    node.addEventListener('mouseleave', function () { light(null); });
    node.addEventListener('blur', function () { light(null); });
  });

  // Orbital motion: the three N-nodes revolve slowly around the hub.
  // Translate-only (labels stay upright); spokes follow each frame.
  // Pauses while the visitor hovers or keyboard-focuses the diagram.
  (function () {
    if (typeof PREFERS_REDUCE !== 'undefined' && PREFERS_REDUCE) return;
    var nodes = viz.querySelectorAll('.n-node');
    var links = viz.querySelectorAll('.n-link');
    if (nodes.length !== 3 || links.length !== 3) return;
    var CX = 380, CY = 260, R = 170;
    var base = [-90, 30, 150].map(function (d) { return d * Math.PI / 180; });
    var TURN = 2 * Math.PI / 75; // one full revolution every 75s
    var angle = 0, paused = false, last = null;

    ['mouseenter', 'focusin'].forEach(function (ev) {
      viz.addEventListener(ev, function () { paused = true; }, { passive: true });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      viz.addEventListener(ev, function () { paused = false; });
    });
    // touch: pause to let the visitor read, then resume on its own
    var touchTimer;
    viz.addEventListener('touchstart', function () {
      paused = true;
      clearTimeout(touchTimer);
      touchTimer = setTimeout(function () { paused = false; }, 6000);
    }, { passive: true });

    function frame(ts) {
      if (last === null) last = ts;
      var dt = Math.min((ts - last) / 1000, 0.1);
      last = ts;
      if (!paused) {
        angle += TURN * dt;
        for (var i = 0; i < 3; i++) {
          var a = base[i] + angle;
          var x = CX + R * Math.cos(a), y = CY + R * Math.sin(a);
          nodes[i].setAttribute('transform', 'translate(' + x.toFixed(2) + ',' + y.toFixed(2) + ')');
          links[i].setAttribute('x1', x.toFixed(2));
          links[i].setAttribute('y1', y.toFixed(2));
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();
})();

// ---------- Eye-anatomy scrollytelling (research) ----------
(function () {
  var scrolly = document.getElementById('eyeScrolly');
  if (!scrolly || !('IntersectionObserver' in window)) return;
  var steps = scrolly.querySelectorAll('.eye-step');
  var parts = ['retina', 'macula', 'optic', 'vessels'];
  var partToStep = { retina: 'retina', macula: 'macula', optic: 'optic', vessels: 'vessels' };

  function activate(part) {
    parts.forEach(function (p) {
      var el = document.getElementById('p-' + p);
      var lab = document.getElementById('l-' + p);
      if (el) { el.classList.toggle('lit', p === part); el.classList.toggle('dim', p !== part); }
      if (lab) lab.classList.toggle('show', p === part);
    });
    steps.forEach(function (s) { s.classList.toggle('active', s.getAttribute('data-part') === part); });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) activate(e.target.getAttribute('data-part'));
    });
  }, { threshold: 0.6, rootMargin: '0px 0px -30% 0px' });
  steps.forEach(function (s) { io.observe(s); });
  activate('retina'); // sensible default before first scroll
})();

// ---------- Publications per-year chart ----------
(function () {
  var chart = document.getElementById('pubChart');
  if (!chart) return;
  var svg = document.getElementById('pubChartSvg');
  var pubs = document.querySelectorAll('.pub[data-year]');
  if (!pubs.length) return;

  var counts = {};
  pubs.forEach(function (p) {
    var y = p.getAttribute('data-year');
    if (/^\d{4}$/.test(y)) counts[y] = (counts[y] || 0) + 1;
  });
  var years = Object.keys(counts).sort();
  if (years.length < 2) return;

  var W = 720, H = 260, mX = 14, mTop = 26, mBot = 34;
  var plotH = H - mTop - mBot, baseY = mTop + plotH;
  var maxC = Math.max.apply(null, years.map(function (y) { return counts[y]; }));
  var slot = (W - 2 * mX) / years.length;
  var barW = Math.min(slot * 0.62, 46);
  var NS = 'http://www.w3.org/2000/svg';
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  svg.appendChild(el('line', { class: 'axis', x1: mX, y1: baseY + 0.5, x2: W - mX, y2: baseY + 0.5 }));

  years.forEach(function (y, i) {
    var c = counts[y];
    var barH = Math.max((c / maxC) * plotH, 4);
    var x = mX + slot * i + (slot - barW) / 2;
    var yTop = baseY - barH;
    var bar = el('rect', { class: 'bar', x: x, y: yTop, width: barW, height: barH, rx: 3 });
    bar.appendChild(el('title', {}, y + ': ' + c + ' publication' + (c > 1 ? 's' : '')));
    if (!PREFERS_REDUCE) bar.style.animationDelay = (i * 55) + 'ms';
    svg.appendChild(bar);
    svg.appendChild(el('text', { class: 'bar-val', x: x + barW / 2, y: yTop - 6 }, c));
    svg.appendChild(el('text', { class: 'bar-yr', x: x + barW / 2, y: baseY + 16 }, y));
  });

  var total = pubs.length;
  var meta = document.getElementById('pubChartMeta');
  if (meta) meta.textContent = total + ' listed · ' + years[0] + '–' + years[years.length - 1];
  chart.hidden = false;

  if (PREFERS_REDUCE || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { chart.classList.add('animate'); io.disconnect(); } });
  }, { threshold: 0.25 });
  io.observe(chart);
})();

// Publication filter (publications page only)
// key can be 'all', a single year ('2024'), or a range ('2006-2017')
function filterPubs(btn, key) {
  document.querySelectorAll('.pub-filters button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.pub').forEach(p => {
    const y = +p.getAttribute('data-year');
    let show = key === 'all';
    if (!show && key.indexOf('-') > -1) {
      const [a, b] = key.split('-').map(Number);
      show = y >= a && y <= b;
    } else if (!show) {
      show = String(y) === key;
    }
    p.style.display = show ? '' : 'none';
  });
}
