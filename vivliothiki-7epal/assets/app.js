/* Βιβλιοθήκη · 7ο ΕΠΑΛ Λάρισας — interaction layer */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("motion-ready");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var canHover = window.matchMedia("(hover: hover)").matches;

  /* ------------------------------------------------------------------ */
  /* Theme                                                              */
  /* ------------------------------------------------------------------ */

  var themeBtn = document.getElementById("theme");
  var themeIcon = document.getElementById("themeIcon");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function paintTheme() {
    var dark = root.dataset.theme === "dark";
    themeIcon.textContent = dark ? "☀" : "☾";
    themeBtn.setAttribute("aria-pressed", String(dark));
    themeBtn.setAttribute(
      "aria-label",
      dark ? "Μετάβαση σε φωτεινή εμφάνιση" : "Μετάβαση σε σκοτεινή εμφάνιση"
    );
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#0e1620" : "#f5c400");
  }

  themeBtn.addEventListener("click", function () {
    var next = root.dataset.theme === "dark" ? "light" : "dark";

    function apply() {
      root.dataset.theme = next;
      try {
        localStorage.setItem("vivliothiki-theme", next);
      } catch (e) {}
      paintTheme();
      buildWaves();
    }

    if (reduceMotion || typeof document.startViewTransition !== "function") {
      apply();
      return;
    }

    var rect = themeBtn.getBoundingClientRect();
    root.style.setProperty("--vx", Math.round(rect.left + rect.width / 2) + "px");
    root.style.setProperty("--vy", Math.round(rect.top + rect.height / 2) + "px");
    try {
      document.startViewTransition(apply);
    } catch (e) {
      apply();
    }
  });

  paintTheme();

  /* ------------------------------------------------------------------ */
  /* Background scene: the PROJECT 7ο waves                             */
  /* ------------------------------------------------------------------ */

  var wavesHost = document.getElementById("waves");
  var waveTimer = 0;
  var waveState = { w: 0, h: 0, theme: "" };

  /* [base, freq1, freq2, phase, colour, alpha, duration] */
  var WAVE_LAYERS = [
    [0.42, 1, 2, 0.3, "blue", 0.13, "80s"],
    [0.58, 2, 3, 1.8, "tape", 0.16, "58s"],
    [0.74, 1, 3, 3.1, "blue", 0.1, "42s"]
  ];

  function waveLine(amp, k1, k2, ph, base, W) {
    var d = "";
    for (var i = 0; i <= 240; i++) {
      var x = (i * W) / 120;
      var t = (x / W) * 2 * Math.PI;
      var y =
        base -
        amp * Math.sin(t * k1 + ph) -
        amp * 0.4 * Math.sin(t * k2 + ph * 1.7);
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    return d;
  }

  function buildWaves() {
    if (!wavesHost) return;

    var W = Math.max(320, window.innerWidth || 320);
    var H = Math.max(480, window.innerHeight || 480);
    var theme = root.dataset.theme || "";
    var k = theme === "dark" ? 1.35 : 0.85;
    var wh = Math.round(H * 0.48);

    var out =
      '<svg class="waves-glow" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">' +
      '<defs><radialGradient id="waveGlow" cx="85%" cy="12%" r="55%">' +
      '<stop offset="0" style="stop-color:var(--tape);stop-opacity:' + (0.22 * k).toFixed(3) + '"/>' +
      '<stop offset="1" style="stop-color:var(--tape);stop-opacity:0"/>' +
      "</radialGradient></defs>" +
      '<rect width="' + W + '" height="' + H + '" fill="url(#waveGlow)"/></svg>';

    WAVE_LAYERS.forEach(function (layer, i) {
      var amp = wh * (0.11 - 0.02 * i);
      var line = waveLine(amp, layer[1], layer[2], layer[3], wh * layer[0], W);
      var fill = "M0 " + wh + "L" + line.slice(1) + "L" + 2 * W + " " + wh + "Z";
      var colour = layer[4];

      out +=
        '<svg class="wv' + (i === 0 ? " rev" : "") + '" style="--t:' + layer[6] +
        ";--h:" + wh + 'px" width="' + 2 * W + '" height="' + wh + '" viewBox="0 0 ' +
        2 * W + " " + wh + '" preserveAspectRatio="none">' +
        '<defs><linearGradient id="waveFill' + i + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" style="stop-color:var(--' + colour + ');stop-opacity:' +
        (layer[5] * k).toFixed(3) + '"/>' +
        '<stop offset="1" style="stop-color:var(--' + colour + ');stop-opacity:' +
        (layer[5] * k * 0.25).toFixed(3) + '"/>' +
        "</linearGradient></defs>" +
        '<path fill="url(#waveFill' + i + ')" d="' + fill + '"/>' +
        '<path fill="none" stroke="var(--' + colour + ')" stroke-opacity="' +
        (layer[5] * 1.6 * k).toFixed(2) + '" stroke-width="1.2" d="' + line + '"/></svg>';
    });

    wavesHost.innerHTML = out;
    waveState = { w: W, h: H, theme: theme };
  }

  buildWaves();

  window.addEventListener(
    "resize",
    function () {
      window.clearTimeout(waveTimer);
      waveTimer = window.setTimeout(function () {
        var W = Math.max(320, window.innerWidth || 320);
        var H = Math.max(480, window.innerHeight || 480);
        /* phones change height while the address bar hides; ignore that */
        if (
          W === waveState.w &&
          Math.abs(H - waveState.h) < 140 &&
          (root.dataset.theme || "") === waveState.theme
        ) {
          return;
        }
        buildWaves();
      }, 180);
    },
    { passive: true }
  );

  /* ------------------------------------------------------------------ */
  /* Mobile navigation                                                  */
  /* ------------------------------------------------------------------ */

  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");

  navToggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Κλείσιμο μενού" : "Άνοιγμα μενού");
  });

  nav.addEventListener("click", function (ev) {
    if (ev.target.closest("a")) {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Άνοιγμα μενού");
    }
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Άνοιγμα μενού");
      navToggle.focus();
    }
  });

  /* ------------------------------------------------------------------ */
  /* Intro curtain (once per session)                                   */
  /* ------------------------------------------------------------------ */

  var intro = document.getElementById("intro");
  var introLive = false;
  var INTRO_LEAD = 0.25;

  if (intro) {
    if (reduceMotion || root.classList.contains("intro-seen")) {
      intro.remove();
    } else {
      introLive = true;
      root.classList.add("intro-live");
      window.setTimeout(function () {
        intro.classList.add("done");
      }, 950);
      window.setTimeout(function () {
        if (intro.parentNode) intro.remove();
        root.classList.remove("intro-live");
        root.classList.add("intro-seen");
        try {
          sessionStorage.setItem("vivliothiki-intro", "1");
        } catch (e) {}
      }, 1700);
    }
  }

  /* Hero pieces arrive in a short cascade, timed to the curtain lifting. */
  var heroTitle = document.querySelector(".hero h1");
  if (heroTitle && !heroTitle.querySelector(".h1-inner")) {
    var h1Inner = document.createElement("span");
    h1Inner.className = "h1-inner";
    while (heroTitle.firstChild) h1Inner.appendChild(heroTitle.firstChild);
    heroTitle.appendChild(h1Inner);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".hero .rv"), function (node, i) {
    var delay = (introLive ? INTRO_LEAD : 0.05) + i * 0.06;
    node.style.setProperty("--d", delay.toFixed(2) + "s");
  });

  var sticker = document.querySelector(".hero-sticker");
  if (sticker && introLive) sticker.style.animationDelay = "0.45s";

  /* ------------------------------------------------------------------ */
  /* Pen line under the page title                                      */
  /* The same calligraphic stroke as the PROJECT 7ο landing page: a     */
  /* lead-in hook, a long swash and a loop that lifts off at the end.   */
  /* ------------------------------------------------------------------ */

  (function penLine() {
    var h1 = document.querySelector(".hero h1");
    if (!h1) return;

    var NS = "http://www.w3.org/2000/svg";
    function mk(name, attrs) {
      var el = document.createElementNS(NS, name);
      for (var key in attrs) el.setAttribute(key, attrs[key]);
      return el;
    }

    var svg = mk("svg", { id: "cal7", "aria-hidden": "true", focusable: "false" });
    var defs = mk("defs", {});
    var grad = mk("linearGradient", { id: "cal7g", gradientUnits: "userSpaceOnUse" });
    var mask = mk("mask", { id: "cal7m", maskUnits: "userSpaceOnUse" });
    var guide = mk("path", {
      fill: "none",
      stroke: "#fff",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
    var ink = mk("path", { fill: "url(#cal7g)", mask: "url(#cal7m)" });
    var tip = mk("circle", { class: "tip", r: "3", fill: "#fff", opacity: "0" });
    mask.append(guide);
    defs.append(grad, mask);
    svg.append(defs, ink, tip);

    var stops = [
      "var(--tape)",
      "color-mix(in srgb, var(--tape) 62%, #ea580c)",
      "color-mix(in srgb, var(--tape) 35%, #e11d48)",
    ];
    grad.replaceChildren.apply(
      grad,
      stops.map(function (colour, i) {
        var stop = mk("stop", { offset: (i / (stops.length - 1)).toFixed(3) });
        stop.style.stopColor = colour;
        return stop;
      })
    );
    tip.style.fill = "#e11d48";
    svg.style.setProperty("--cal-a", "var(--tape)");

    /* Points are [share of width, x in u, y in u], u = fontSize / 100. */
    var SEG = [
      [[0, -2, -1], [-0.006, -3, 7], [0.03, 0, 10], [0.08, 0, 9]],
      [[0.08, 0, 9], [0.3, 0, 6], [0.55, 0, 14], [0.82, 0, 6]],
      [[0.82, 0, 6], [0.91, 0, 2.5], [0.985, 9, -12], [0.955, 4, -15.5]],
      [[0.955, 4, -15.5], [0.92, 0, -17.5], [0.905, -6, 4], [0.965, 0, 10.5]],
      [[0.965, 0, 10.5], [1, 0, 13.5], [1, 11, 6], [1, 23, -8]],
    ];

    var len = 0;
    var ready = false;
    var progress = 0;
    var frame = 0;

    function textRects(node, out) {
      for (var n = node.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) continue;
          var range = document.createRange();
          range.selectNodeContents(n);
          var rects = range.getClientRects();
          for (var i = 0; i < rects.length; i++) out.push(rects[i]);
        } else if (n.nodeType === 1 && n.id !== "cal7") {
          textRects(n, out);
        }
      }
    }

    function build() {
      var fontSize = parseFloat(getComputedStyle(h1).fontSize) || 64;
      var u = fontSize / 100;
      var hr = h1.getBoundingClientRect();
      var rects = [];
      textRects(h1, rects);
      if (!rects.length || !hr.width) {
        ready = false;
        return;
      }

      var lastBottom = Math.max.apply(
        Math,
        rects.map(function (r) {
          return r.bottom;
        })
      );
      var L = Infinity,
        R = -Infinity,
        B = -Infinity;
      rects.forEach(function (r) {
        if (r.bottom > lastBottom - 4) {
          L = Math.min(L, r.left);
          R = Math.max(R, r.right);
          B = Math.max(B, r.bottom);
        }
      });

      var width = R - L;
      var x0 = L - hr.left;
      var y0 = B - hr.top - fontSize * 0.03;
      function P(pt) {
        return [x0 + pt[0] * width + pt[1] * u, y0 + pt[2] * u];
      }

      /* sample the cubic beziers */
      var pts = [];
      SEG.forEach(function (seg, si) {
        var p = seg.map(P);
        for (var i = si ? 1 : 0; i <= 40; i++) {
          var t = i / 40,
            m = 1 - t;
          pts.push([
            m * m * m * p[0][0] + 3 * m * m * t * p[1][0] + 3 * m * t * t * p[2][0] + t * t * t * p[3][0],
            m * m * m * p[0][1] + 3 * m * m * t * p[1][1] + 3 * m * t * t * p[2][1] + t * t * t * p[3][1],
          ]);
        }
      });

      /* cumulative length gives the pen pressure along the stroke */
      var cl = [0];
      for (var i = 1; i < pts.length; i++) {
        cl.push(cl[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      }
      var total = cl[cl.length - 1];
      var smooth = function (a, b, x) {
        x = Math.min(1, Math.max(0, (x - a) / (b - a)));
        return x * x * (3 - 2 * x);
      };
      var nib = -0.62;
      var left = [],
        right = [];
      for (var i = 0; i < pts.length; i++) {
        var a = pts[Math.max(0, i - 1)];
        var b = pts[Math.min(pts.length - 1, i + 1)];
        var dx = b[0] - a[0];
        var dy = b[1] - a[1];
        var d = Math.hypot(dx, dy) || 1;
        var ang = Math.atan2(dy, dx);
        var f = cl[i] / total;
        var press = smooth(0, 0.07, f) * (1 - 0.85 * smooth(0.8, 1, f)) * (0.9 + 0.25 * Math.sin(f * 9.5));
        var w = u * (0.9 + 12 * press * (0.22 + 0.78 * Math.abs(Math.sin(ang - nib))));
        var nx = -dy / d,
          ny = dx / d;
        left.push([pts[i][0] + (nx * w) / 2, pts[i][1] + (ny * w) / 2]);
        right.push([pts[i][0] - (nx * w) / 2, pts[i][1] - (ny * w) / 2]);
      }

      var f2 = function (p) {
        return p[0].toFixed(1) + " " + p[1].toFixed(1);
      };
      var outline =
        "M" + left.map(f2).join("L") + "L" + right.reverse().map(f2).join("L") + "Z";
      ink.setAttribute("d", outline);
      guide.setAttribute("d", "M" + pts.map(f2).join("L"));
      guide.setAttribute("stroke-width", (u * 16).toFixed(1));

      var xs = pts.map(function (p) {
        return p[0];
      });
      grad.setAttribute("x1", (Math.min.apply(Math, xs) - u * 8).toFixed(1));
      grad.setAttribute("x2", (Math.max.apply(Math, xs) + u * 8).toFixed(1));
      grad.setAttribute("y1", "0");
      grad.setAttribute("y2", "0");
      mask.setAttribute("x", -20);
      mask.setAttribute("y", -20);
      mask.setAttribute("width", hr.width + fontSize);
      mask.setAttribute("height", hr.height + fontSize);
      svg.setAttribute("width", Math.ceil(hr.width));
      svg.setAttribute("height", Math.ceil(hr.height));
      tip.setAttribute("r", (u * 2.4).toFixed(1));

      len = guide.getTotalLength();
      guide.setAttribute("stroke-dasharray", len + " " + (len + 10));
      ready = true;
      setProgress(progress);
    }

    function setProgress(p) {
      progress = p;
      if (!ready) return;
      guide.setAttribute("stroke-dashoffset", (len * (1 - p)).toFixed(2));
      if (p > 0 && p < 1) {
        var pt = guide.getPointAtLength(len * p);
        tip.setAttribute("cx", pt.x.toFixed(1));
        tip.setAttribute("cy", pt.y.toFixed(1));
        tip.setAttribute("opacity", ".95");
      } else {
        tip.setAttribute("opacity", "0");
      }
    }

    var still = reduceMotion || root.classList.contains("no-motion");
    function draw(delay) {
      cancelAnimationFrame(frame);
      if (still) {
        setProgress(1);
        return;
      }
      setProgress(0);
      var duration = 1700;
      var start = 0;
      var ease = function (t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      var step = function (now) {
        if (!start) start = now + delay;
        var t = Math.min(1, Math.max(0, (now - start) / duration));
        setProgress(ease(t));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }

    if (!h1.querySelector("#cal7")) h1.prepend(svg);
    build();

    var queued = 0;
    function refresh() {
      if (!queued) {
        queued = requestAnimationFrame(function () {
          queued = 0;
          build();
        });
      }
    }
    if ("ResizeObserver" in window) new ResizeObserver(refresh).observe(h1);
    window.addEventListener("resize", refresh, { passive: true });

    function go() {
      build();
      draw(introLive ? 1450 : 380);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(go);
    } else {
      window.addEventListener("load", go, { once: true });
    }
  })();

  /* ------------------------------------------------------------------ */
  /* Headings: split into words that rise out of the line               */
  /* ------------------------------------------------------------------ */

  Array.prototype.forEach.call(document.querySelectorAll(".panel h2"), function (heading) {
    if (heading.dataset.split) return;
    var text = (heading.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;

    var frag = document.createDocumentFragment();
    text.split(" ").forEach(function (word, i) {
      if (i) frag.appendChild(document.createTextNode(" "));
      var w = document.createElement("span");
      w.className = "w";
      w.style.setProperty("--i", i);
      var inner = document.createElement("span");
      inner.textContent = word;
      w.appendChild(inner);
      frag.appendChild(w);
    });

    heading.textContent = "";
    heading.appendChild(frag);
    heading.dataset.split = "1";
  });

  /* ------------------------------------------------------------------ */
  /* Section numbers + staggered children                               */
  /* ------------------------------------------------------------------ */

  Array.prototype.forEach.call(document.querySelectorAll("main .panel"), function (panel, i) {
    var num = document.createElement("span");
    num.className = "sec-num";
    num.setAttribute("aria-hidden", "true");
    num.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
    num.dataset.parallax = "-0.05";
    panel.appendChild(num);

    Array.prototype.forEach.call(
      panel.querySelectorAll(".cards, .news, .steps, .terms-grid, .grid-2, .contact-grid"),
      function (group) {
        Array.prototype.forEach.call(group.children, function (child, j) {
          child.classList.add("rv-child");
          child.style.setProperty("--i", j);
        });
      }
    );
  });

  var statsSection = document.querySelector(".stats");
  if (statsSection) {
    Array.prototype.forEach.call(statsSection.children, function (child, i) {
      child.classList.add("rv-child");
      child.style.setProperty("--i", i);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Parallax (transform only, measured from untransformed positions)   */
  /* ------------------------------------------------------------------ */

  var HERO_PARALLAX = [
    [".hero .sub", -0.03],
    [".hero h1", -0.045],
    [".hero .shelf", -0.07]
  ];

  HERO_PARALLAX.forEach(function (pair) {
    Array.prototype.forEach.call(document.querySelectorAll(pair[0]), function (node) {
      node.dataset.parallax = String(pair[1]);
    });
  });

  var parallaxItems = [];

  function measureParallax() {
    parallaxItems = [];
    if (reduceMotion) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-parallax]"), function (node) {
      var speed = parseFloat(node.dataset.parallax);
      if (!speed) return;
      node.style.transform = "";
      var rect = node.getBoundingClientRect();
      parallaxItems.push({
        el: node,
        top: rect.top + (window.scrollY || window.pageYOffset),
        height: rect.height,
        speed: speed
      });
    });
  }

  function parallaxFrame() {
    var vh = window.innerHeight;
    var y = window.scrollY || window.pageYOffset;
    parallaxItems.forEach(function (item) {
      var mid = item.top - y + item.height / 2;
      if (mid < -vh * 0.6 || mid > vh * 1.6) return;
      var offset = (mid - vh / 2) * item.speed;
      item.el.style.transform = "translateY(" + offset.toFixed(2) + "px)";
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll chrome: progress, header shadow, back-to-top, spot light    */
  /* ------------------------------------------------------------------ */

  var bar = document.getElementById("progress");
  var header = document.getElementById("topbar");
  var toTop = document.getElementById("toTop");
  var glow = document.getElementById("glow");
  var rail = document.getElementById("rail");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? Math.min(y / max, 1) : 0;
    bar.style.transform = "scaleX(" + progress + ")";
    header.classList.toggle("stuck", y > 8);
    toTop.classList.toggle("vis", y > 640);
    if (rail) rail.style.setProperty("--p", progress.toFixed(4));
    parallaxFrame();
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );

  measureParallax();
  onScroll();

  window.addEventListener("resize", function () {
    measureParallax();
    onScroll();
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      measureParallax();
      onScroll();
    });
  }

  /* Catalog rows load and expand after first paint, which moves every
     section below them. Re-measure when the document height changes. */
  if ("ResizeObserver" in window) {
    var remeasureTimer = 0;
    var layoutObserver = new ResizeObserver(function () {
      window.clearTimeout(remeasureTimer);
      remeasureTimer = window.setTimeout(function () {
        measureParallax();
        onScroll();
      }, 140);
    });
    layoutObserver.observe(document.body);
  }

  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  if (glow && !reduceMotion) {
    window.addEventListener(
      "pointermove",
      function (ev) {
        glow.style.setProperty("--mx", ev.clientX + "px");
        glow.style.setProperty("--my", ev.clientY + "px");
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll                                                   */
  /* ------------------------------------------------------------------ */

  var reveals = document.querySelectorAll(".rv, .panel");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Stat counters                                                      */
  /* ------------------------------------------------------------------ */

  var counters = statsSection ? Array.prototype.slice.call(statsSection.querySelectorAll("b")) : [];

  function counterTarget(node) {
    return parseInt((node.dataset.count || node.textContent || "").replace(/[^\d]/g, ""), 10) || 0;
  }

  function runCounter(node, delay) {
    var target = counterTarget(node);
    node.dataset.count = String(target);
    node.dataset.counting = "1";

    if (!target || reduceMotion) {
      node.textContent = target.toLocaleString("el-GR");
      node.dataset.counting = "0";
      return;
    }

    var start = null;
    var duration = 1150;

    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      node.textContent = Math.round(target * eased).toLocaleString("el-GR");
      if (t < 1) {
        window.requestAnimationFrame(step);
      } else {
        node.textContent = target.toLocaleString("el-GR");
        node.dataset.counting = "0";
        node.classList.remove("counted");
        void node.offsetWidth;
        node.classList.add("counted");
      }
    }

    window.setTimeout(function () {
      window.requestAnimationFrame(step);
    }, delay || 0);
  }

  if (counters.length) {
    if (!reduceMotion && "IntersectionObserver" in window) {
      counters.forEach(function (node) {
        node.dataset.count = String(counterTarget(node));
        node.textContent = "0";
      });

      var countObserver = new IntersectionObserver(
        function (entries) {
          if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
          countObserver.disconnect();
          var wait = root.classList.contains("intro-live") ? 1000 : 0;
          counters.forEach(function (node, i) {
            runCounter(node, wait + i * 90);
          });
        },
        { threshold: 0.4 }
      );
      countObserver.observe(statsSection);
    } else {
      counters.forEach(function (node) {
        node.dataset.count = String(counterTarget(node));
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Active section in the header nav                                   */
  /* ------------------------------------------------------------------ */

  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var visible = new Set();
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        var current = null;
        sections.forEach(function (sec) {
          if (visible.has(sec.id) && !current) current = sec.id;
        });
        navLinks.forEach(function (link) {
          link.classList.toggle("act", link.getAttribute("href") === "#" + current);
        });
      },
      { rootMargin: "-40% 0px -52% 0px" }
    );
    sections.forEach(function (sec) {
      sectionObserver.observe(sec);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Athens clock, date, opening status                                 */
  /* ------------------------------------------------------------------ */

  var clockEl = document.getElementById("clock");
  var dateEl = document.getElementById("date");
  var statusEl = document.getElementById("status");
  var statusTextEl = document.getElementById("statusText");
  var table = document.getElementById("schedule");
  var rows = table ? Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-start]")) : [];

  var DAY_NAMES = {
    0: "Κυριακή",
    1: "Δευτέρα",
    2: "Τρίτη",
    3: "Τετάρτη",
    4: "Πέμπτη",
    5: "Παρασκευή",
    6: "Σάββατο"
  };
  var DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  var clockFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Athens",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  var dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Athens", weekday: "short" });
  var dateFmt = new Intl.DateTimeFormat("el-GR", {
    timeZone: "Europe/Athens",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function hhmm(minutes) {
    return pad(Math.floor(minutes / 60)) + ":" + pad(minutes % 60);
  }

  function athensNow() {
    var now = new Date();
    var parts = clockFmt.formatToParts(now);
    var hour = 0;
    var minute = 0;
    parts.forEach(function (p) {
      if (p.type === "hour") hour = parseInt(p.value, 10) % 24;
      if (p.type === "minute") minute = parseInt(p.value, 10);
    });
    return {
      date: now,
      day: DAY_INDEX[dayFmt.format(now)] || 0,
      minutes: hour * 60 + minute,
      label: pad(hour) + ":" + pad(minute)
    };
  }

  function slotsFor(day) {
    return rows
      .filter(function (row) {
        return Number(row.dataset.day) === day;
      })
      .map(function (row) {
        return {
          start: Number(row.dataset.start),
          end: Number(row.dataset.end),
          el: row
        };
      })
      .sort(function (a, b) {
        return a.start - b.start;
      });
  }

  function clearRowHighlights() {
    rows.forEach(function (row) {
      row.classList.remove("today", "now-row");
    });
  }

  function tick() {
    var now = athensNow();
    clockEl.textContent = now.label;

    var longDate = dateFmt.format(now.date);
    dateEl.textContent = longDate.charAt(0).toUpperCase() + longDate.slice(1);

    clearRowHighlights();

    slotsFor(now.day).forEach(function (slot) {
      if (slot.el.dataset.day === String(now.day)) slot.el.classList.add("today");
    });

    var live = slotsFor(now.day).filter(function (slot) {
      return now.minutes >= slot.start && now.minutes < slot.end;
    })[0];

    statusEl.classList.toggle("open", Boolean(live));

    if (live) {
      live.el.classList.add("now-row");
      statusTextEl.textContent = "Ανοιχτά τώρα · δανεισμός έως " + hhmm(live.end);
      return;
    }

    /* find the next slot within the coming week */
    for (var offset = 0; offset < 8; offset++) {
      var day = (now.day + offset) % 7;
      var slots = slotsFor(day);
      if (!slots.length) continue;

      var next =
        offset === 0
          ? slots.filter(function (s) {
              return s.start > now.minutes;
            })[0]
          : slots[0];

      if (!next) continue;

      var when =
        offset === 0
          ? "σήμερα στις " + hhmm(next.start)
          : DAY_NAMES[day] + " στις " + hhmm(next.start);
      statusTextEl.textContent = "Κλειστά τώρα · ανοίγει " + when;
      return;
    }

    statusTextEl.textContent = "Κλειστά τώρα · δεν υπάρχει προγραμματισμένη ώρα δανεισμού";
  }

  if (clockEl && statusTextEl && rows.length) {
    tick();
    window.setInterval(tick, 15000);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) tick();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Weekday filter for the schedule                                    */
  /* ------------------------------------------------------------------ */

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var allRows = table ? Array.prototype.slice.call(table.querySelectorAll("tbody tr")) : [];

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var day = tab.dataset.day;
      tabs.forEach(function (other) {
        other.classList.toggle("act", other === tab);
        other.setAttribute("aria-pressed", String(other === tab));
      });
      allRows.forEach(function (row) {
        row.hidden = day !== "all" && row.dataset.day !== day;
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Book catalogue                                                     */
  /* ------------------------------------------------------------------ */

  var catSection = document.getElementById("katalogos");
  var bookQuery = document.getElementById("bookQuery");
  var bookClear = document.getElementById("bookClear");
  var catChips = document.getElementById("catChips");
  var bookCount = document.getElementById("bookCount");
  var bookShown = document.getElementById("bookShown");
  var bookList = document.getElementById("bookList");
  var bookEmpty = document.getElementById("bookEmpty");
  var bookMore = document.getElementById("bookMore");

  var DEWEY_LABELS = {
    "0": "Γενικά",
    "1": "Φιλοσοφία",
    "2": "Θρησκεία",
    "3": "Κοινωνικά",
    "4": "Γλώσσα",
    "5": "Επιστήμες",
    "6": "Τεχνολογία",
    "7": "Τέχνες",
    "8": "Λογοτεχνία",
    "9": "Ιστορία",
    none: "Λοιπά"
  };

  var PAGE = 24;
  var catalog = null;
  var catalogPromise = null;
  var books = [];
  var activeCat = "all";
  var shown = PAGE;

  /* Greek text folding: accents, tonos, final sigma. */
  function fold(text) {
    return String(text == null ? "" : text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f\u1fbd-\u1fff]/g, "")
      .replace(/ς/g, "σ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* Top-level class, e.g. 889 -> "8", 30 -> "0". A few myLib records carry a
     trailing zero (6100, 9220), so normalise those to their 3-digit class. */
  function deweyClass(value) {
    var n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "none";
    while (n >= 1000) n = n / 10;
    var hundreds = Math.floor(n / 100);
    return hundreds >= 1 && hundreds <= 9 ? String(hundreds) : "0";
  }

  function deweyText(value) {
    var n = Number(value);
    return Number.isFinite(n) && n > 0 ? String(n) : "—";
  }

  function prepare(list) {
    return list.map(function (book) {
      var cat = deweyClass(book.dewey);
      var haystack = fold(
        [book.title, book.subtitle, book.author, book.publisher, book.callno, deweyText(book.dewey)].join(" ")
      );
      return {
        title: book.title || "Χωρίς τίτλο",
        subtitle: book.subtitle || "",
        author: book.author || "",
        publisher: book.publisher || "",
        callno: book.callno || "",
        info: book.info || "",
        dewey: deweyText(book.dewey),
        cat: cat,
        haystack: haystack
      };
    });
  }

  function matchesCat(book, cat) {
    return cat === "all" || book.cat === cat;
  }

  function matchesQuery(book, tokens) {
    for (var i = 0; i < tokens.length; i++) {
      if (book.haystack.indexOf(tokens[i]) === -1) return false;
    }
    return true;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderBook(book) {
    var li = el("li", "book-row");
    var body = el("div", "book-body");

    body.appendChild(el("div", "book-title", book.title));
    if (book.subtitle) body.appendChild(el("div", "book-author", book.subtitle));
    if (book.author) body.appendChild(el("div", "book-author", book.author));

    var meta = [book.publisher, book.dewey !== "—" ? "Dewey " + book.dewey : ""].filter(Boolean).join(" · ");
    if (meta) body.appendChild(el("div", "book-meta", meta));
    if (book.info) body.appendChild(el("div", "book-info", book.info));

    li.appendChild(body);

    if (book.callno) {
      var call = el("span", "book-call");
      call.appendChild(el("small", null, "Ταξ. αρ."));
      call.appendChild(document.createTextNode(book.callno));
      li.appendChild(call);
    }

    return li;
  }

  function render() {
    if (!catalog) return;

    var query = fold(bookQuery ? bookQuery.value : "");
    var tokens = query.split(" ").filter(Boolean);

    var filtered = books.filter(function (book) {
      return matchesCat(book, activeCat) && (!tokens.length || matchesQuery(book, tokens));
    });

    var slice = filtered.slice(0, shown);

    bookList.textContent = "";
    var frag = document.createDocumentFragment();
    slice.forEach(function (book, i) {
      var row = renderBook(book);
      row.style.setProperty("--i", Math.min(i, 16));
      frag.appendChild(row);
    });
    bookList.appendChild(frag);

    var total = books.length;
    bookCount.textContent =
      total.toLocaleString("el-GR") +
      (tokens.length || activeCat !== "all" ? " βιβλία στη συλλογή · " + filtered.length.toLocaleString("el-GR") + " αποτελέσματα" : " βιβλία στη συλλογή");

    bookCount.classList.remove("bump");
    void bookCount.offsetWidth;
    bookCount.classList.add("bump");

    if (filtered.length > slice.length) {
      bookShown.textContent = "Εμφανίζονται " + slice.length.toLocaleString("el-GR") + " από " + filtered.length.toLocaleString("el-GR");
    } else if (filtered.length) {
      bookShown.textContent = "Εμφανίζονται όλα τα " + filtered.length.toLocaleString("el-GR");
    } else {
      bookShown.textContent = "";
    }

    bookEmpty.hidden = filtered.length > 0;
    bookMore.hidden = filtered.length <= slice.length;

    if (bookClear) bookClear.hidden = !query;
  }

  function buildChips() {
    if (!catChips) return;

    var counts = {};
    books.forEach(function (book) {
      counts[book.cat] = (counts[book.cat] || 0) + 1;
    });

    var order = ["all", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "none"];

    catChips.textContent = "";
    var chipIndex = 0;
    order.forEach(function (key) {
      if (key !== "all" && !counts[key]) return;

      var chip = el("button", "cat-chip" + (key === activeCat ? " act" : ""));
      chip.type = "button";
      chip.dataset.cat = key;
      chip.style.setProperty("--i", chipIndex++);
      chip.setAttribute("aria-pressed", String(key === activeCat));

      var label =
        key === "all" ? "Όλα" : key === "none" ? "— Λοιπά" : key + "00 " + DEWEY_LABELS[key];
      chip.appendChild(document.createTextNode(label + " "));
      chip.appendChild(el("b", null, String(counts[key] || books.length)));
      chip.appendChild(el("span", "visually-hidden", " βιβλία"));
      catChips.appendChild(chip);
    });
  }

  function loadCatalog() {
    if (catalogPromise) return catalogPromise;

    catalogPromise = fetch("assets/catalog.json", { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        books = prepare(Array.isArray(data.books) ? data.books : []);
        catalog = data;
        document.querySelectorAll("[data-catalog-count]").forEach(function (node) {
          node.dataset.count = String(books.length);
          if (node.dataset.counting === "1") return;
          node.textContent = books.length.toLocaleString("el-GR");
        });
        buildChips();
        render();
        return data;
      })
      .catch(function (err) {
        catalogPromise = null;
        if (bookCount) bookCount.textContent = "Ο κατάλογος δεν φορτώθηκε.";
        if (bookShown) bookShown.textContent = "";
        if (bookEmpty) {
          bookEmpty.textContent = "Ο κατάλογος δεν φορτώθηκε αυτή τη στιγμή. Ανανέωσε τη σελίδα ή ρώτησε τους υπεύθυνους της βιβλιοθήκης.";
          bookEmpty.hidden = false;
        }
        throw err;
      });

    return catalogPromise;
  }

  if (catSection && bookList) {
    /* Load only when the catalogue approaches the viewport, on focus, or on click. */
    if ("IntersectionObserver" in window) {
      var catalogObserver = new IntersectionObserver(
        function (entries) {
          if (entries.some(function (entry) { return entry.isIntersecting; })) {
            catalogObserver.disconnect();
            loadCatalog().catch(function () {});
          }
        },
        { rootMargin: "900px 0px" }
      );
      catalogObserver.observe(catSection);
    } else {
      loadCatalog().catch(function () {});
    }

    if (bookQuery) {
      bookQuery.addEventListener("focus", function () {
        loadCatalog().catch(function () {});
      });

      var debounce = 0;
      bookQuery.addEventListener("input", function () {
        window.clearTimeout(debounce);
        debounce = window.setTimeout(function () {
          if (!catalog) {
            loadCatalog().catch(function () {});
            return;
          }
          shown = PAGE;
          render();
        }, 130);
      });

      bookQuery.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape") {
          bookQuery.value = "";
          shown = PAGE;
          if (catalog) render();
          else bookQuery.blur();
        }
      });
    }

    if (bookClear) {
      bookClear.addEventListener("click", function () {
        if (bookQuery) bookQuery.value = "";
        shown = PAGE;
        if (catalog) render();
        if (bookQuery) bookQuery.focus();
      });
    }

    if (catChips) {
      catChips.addEventListener("click", function (ev) {
        var chip = ev.target.closest(".cat-chip");
        if (!chip) return;
        activeCat = chip.dataset.cat || "all";
        shown = PAGE;
        Array.prototype.forEach.call(catChips.querySelectorAll(".cat-chip"), function (other) {
          var on = other === chip;
          other.classList.toggle("act", on);
          other.setAttribute("aria-pressed", String(on));
        });
        if (catalog) render();
      });
    }

    if (bookMore) {
      bookMore.addEventListener("click", function () {
        shown += PAGE;
        render();
      });
    }

    /* "/" jumps to the catalogue search, like on documentation sites. */
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "/" || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var tag = (ev.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || ev.target.isContentEditable) return;
      if (!bookQuery) return;
      ev.preventDefault();
      catSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      bookQuery.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Pointer flourishes: magnetism, tilt, follower                      */
  /* ------------------------------------------------------------------ */

  if (!reduceMotion && finePointer && canHover) {
    Array.prototype.forEach.call(
      document.querySelectorAll(".chip-primary, .ib, .to-top"),
      function (node) {
        node.classList.add("mag");
        node.addEventListener("pointermove", function (ev) {
          var rect = node.getBoundingClientRect();
          var dx = (ev.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          var dy = (ev.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
          node.style.setProperty("--tx", (dx * 7).toFixed(1) + "px");
          node.style.setProperty("--ty", (dy * 5).toFixed(1) + "px");
        });
        node.addEventListener("pointerleave", function () {
          node.style.setProperty("--tx", "0px");
          node.style.setProperty("--ty", "0px");
        });
      }
    );
  }

  if (!reduceMotion && canHover) {
    Array.prototype.forEach.call(
      document.querySelectorAll(".now-card, .term-card, .note-card"),
      function (node) {
        node.classList.add("tilt");
        node.addEventListener("pointermove", function (ev) {
          var rect = node.getBoundingClientRect();
          var dx = (ev.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          var dy = (ev.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
          node.style.setProperty("--ry", (dx * 2).toFixed(2) + "deg");
          node.style.setProperty("--rx", (-dy * 2).toFixed(2) + "deg");
        });
        node.addEventListener("pointerleave", function () {
          node.style.setProperty("--ry", "0deg");
          node.style.setProperty("--rx", "0deg");
        });
      }
    );
  }

  if (!reduceMotion && finePointer && canHover) {
    var cursor = document.createElement("div");
    cursor.id = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);

    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    var tx = cx;
    var ty = cy;
    var cursorMoving = false;

    function cursorTick() {
      cx += (tx - cx) * 0.2;
      cy += (ty - cy) * 0.2;
      cursor.style.transform =
        "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0) translate(-50%,-50%)";
      if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) {
        window.requestAnimationFrame(cursorTick);
      } else {
        cursorMoving = false;
      }
    }

    document.addEventListener(
      "pointermove",
      function (ev) {
        if (ev.pointerType === "touch") return;
        tx = ev.clientX;
        ty = ev.clientY;
        cursor.classList.add("on");
        if (!cursorMoving) {
          cursorMoving = true;
          window.requestAnimationFrame(cursorTick);
        }
      },
      { passive: true }
    );

    document.addEventListener(
      "pointerover",
      function (ev) {
        var hot = ev.target.closest && ev.target.closest("a, button, summary, input, .book-row, .cat-chip");
        cursor.classList.toggle("hot", Boolean(hot));
      },
      { passive: true }
    );

    document.addEventListener("pointerdown", function () {
      cursor.classList.add("down");
    });
    document.addEventListener("pointerup", function () {
      cursor.classList.remove("down");
    });
    document.addEventListener("pointerleave", function () {
      cursor.classList.remove("on");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Footer year (Athens)                                               */
  /* ------------------------------------------------------------------ */

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Athens", year: "numeric" }).format(new Date());
})();
