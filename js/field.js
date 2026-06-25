// ============================================================
//  FIELD WORK — categories left; right side is a STACK of screenshots
//  laid on top of each other like the pages of a (coverless) book.
//  Each page rests crumpled; hover/focus un-crumples it RAPIDLY into a
//  clean sheet. Click a page to flip to the next; the ↗ opens the
//  lightbox. Data from js/field-data.js (window.FIELD_SHOTS).
// ============================================================
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const section = document.getElementById("field");
  if (!section || !window.FIELD_SHOTS) return;

  const SHOTS = window.FIELD_SHOTS;
  const BASE = "assets/work/";
  const gsapOK = window.gsap && !prefersReduced;
  const VIS = 5; // how many pages of the pile peek out behind the top one
  const nav = section.querySelector(".field__nav");
  const stage = section.querySelector(".field__stage");
  if (!nav || !stage) return;

  const DOMAINS = [
    { key: "ai", label: "AI / LLM Training" },
    { key: "cv", label: "Data Annotation" },
  ];
  const CATS = {
    ai: [
      { id: "voice",       no: "A1", title: "Voice & Audio Evaluation",
        desc: "Rating TTS and speech-to-speech outputs on content, style, persona, pacing and intonation — plus dual-ACR preference and transcript correction." },
      { id: "prompt",      no: "A2", title: "Prompt Writing & Image Generation",
        desc: "Authoring generation / edit prompts, reverse-prompting from targets, photo-degradation and pixel-perfect pattern extraction for image models." },
      { id: "ground",      no: "A3", title: "Visual Grounding — BBox & Referring Expressions",
        desc: "Dense structured bounding boxes, identity recognition and rich referring-expression grounding with chain-of-thought verification." },
      { id: "video",       no: "A4", title: "Video Inpainting & Referring Expression",
        desc: "Imagining and placing elements into video through prompts, choosing locations, and verifying spatio-temporal video referring expressions." },
      { id: "eval",        no: "A5", title: "Image ↔ Text Evaluation",
        desc: "Scoring image-to-text outputs with rating justification, prompt writing and factual verification across multimodal models." },
      { id: "adversarial", no: "A6", title: "Adversarial Model Challenge",
        desc: "Red-teaming vision-language models with challenging expressions and model-breaker prompts to surface failure modes." },
    ],
    cv: [
      { id: "cv", no: "C1", title: "Computer-Vision Annotation at Scale",
        desc: "High-precision labeling for autonomous-driving datasets across 2D imagery, in-scene text and 3D LiDAR point clouds — each with multi-stage QA.",
        pdf: BASE + "data-annotation-casestudy.pdf" },
    ],
  };
  const CAP = {
    "cv-2d.jpg": "2D annotation — vehicle bounding boxes & brake-signal states",
    "cv-text.jpg": "Text annotation — in-scene text labeling",
    "cv-3d-lidar.jpg": "3D LiDAR point-cloud — region-of-interest annotation",
  };

  function caption(file) {
    if (CAP[file]) return CAP[file];
    let s = file.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    s = s
      .replace(/\bbbox\b/gi, "BBox").replace(/\bai\b/gi, "AI").replace(/\bcot\b/gi, "CoT")
      .replace(/\bqa\b/gi, "QA").replace(/\bs2s\b/gi, "S2S").replace(/\btts\b/gi, "TTS")
      .replace(/\bacr\b/gi, "ACR").replace(/\brm\b/gi, "RM").replace(/\belo\b/gi, "ELO")
      .replace(/\big\b/gi, "IG").replace(/\b3d\b/gi, "3D").replace(/\b2d\b/gi, "2D");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  const cursorEl = document.getElementById("cursor");
  function bindCursor(root) {
    if (!cursorEl) return;
    root.querySelectorAll("[data-cursor='hover']").forEach((e) => {
      e.addEventListener("mouseenter", () => cursorEl.classList.add("is-hover"));
      e.addEventListener("mouseleave", () => cursorEl.classList.remove("is-hover"));
    });
  }
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const pad = (n) => String(n).padStart(2, "0");

  // ---------------------------------------------------------
  //  LEFT NAV
  // ---------------------------------------------------------
  let current = null;
  const allItems = [];
  DOMAINS.forEach((d) => {
    const group = el("div", "nav-group");
    group.appendChild(el("div", "nav-group__label", d.label));
    const list = el("div", "field__navlist");
    CATS[d.key].forEach((meta) => {
      const n = (SHOTS[meta.id] || []).length;
      const b = el("button", "field__navitem",
        `<span class="ix">${meta.no}</span><span class="nm">${meta.title}</span><span class="ct">${n}</span>`);
      b.setAttribute("data-cursor", "hover");
      b._meta = meta;
      b.addEventListener("click", () => select(meta, b));
      list.appendChild(b);
      allItems.push(b);
    });
    group.appendChild(list);
    nav.appendChild(group);
  });
  bindCursor(nav);
  const setActiveNav = (btn) => allItems.forEach((b) => b.classList.toggle("is-on", b === btn));

  // ---------------------------------------------------------
  //  RIGHT STAGE — the page stack
  // ---------------------------------------------------------
  function renderStage(meta) {
    const files = SHOTS[meta.id] || [];
    const N = files.length;
    stage.innerHTML = "";

    stage.appendChild(el("div", "stage__head",
      `<span class="stage__no">${meta.no}</span>
       <h3>${meta.title}</h3>
       <p>${meta.desc}</p>
       <span class="stage__count">${N} ${N === 1 ? "capture" : "captures"}</span>`));

    const book = el("div", "book" + (gsapOK ? "" : " is-static"));
    const restRot = [];
    const pageEls = files.map((file, i) => {
      restRot[i] = rand(-4, 4);
      const cap = caption(file);
      const pg = el("button", "page",
        `<span class="page__sheet">
           <img src="${BASE}${file}" alt="${cap.replace(/"/g, "&quot;")}" loading="lazy" />
           <span class="page__crump" aria-hidden="true"></span>
           <span class="page__tag">${cap}</span>
           <span class="page__exp" aria-hidden="true" data-exp>↗</span>
         </span>`);
      pg.setAttribute("data-cursor", "hover");
      book.appendChild(pg);
      return pg;
    });
    stage.appendChild(book);

    // flip controls + counter
    let nav2 = null, counterEl = null;
    if (N > 1 && gsapOK) {
      nav2 = el("div", "book__nav",
        `<button class="book__btn" data-dir="-1" aria-label="Previous page">‹</button>
         <span class="book__counter"></span>
         <button class="book__btn" data-dir="1" aria-label="Next page">›</button>
         <span class="book__hint">click page to flip · ↗ to expand</span>`);
      stage.appendChild(nav2);
      counterEl = nav2.querySelector(".book__counter");
    }

    if (meta.pdf) {
      const a = el("a", "field__pdf",
        `View full annotation case study <span aria-hidden="true">↗ PDF</span>`);
      a.href = meta.pdf; a.target = "_blank"; a.rel = "noopener";
      a.setAttribute("data-cursor", "hover");
      stage.appendChild(a);
    }
    bindCursor(stage);

    // ---- non-animated fallback: pages already flow as a grid (CSS) ----
    if (!gsapOK) {
      pageEls.forEach((pg, i) => {
        pg.querySelector("[data-exp]").addEventListener("click", (e) => {
          e.stopPropagation(); openLightbox(files, i, meta);
        });
        pg.addEventListener("click", () => openLightbox(files, i, meta));
      });
      return;
    }

    // ---- animated stack ----
    let order = files.map((_, i) => i);
    let busy = false;

    const varsFor = (idx, p) => {
      const depth = Math.min(p, VIS);
      const top = p === 0;
      return {
        x: top ? 0 : depth * 7,
        y: top ? 0 : depth * 9,
        rotation: restRot[idx],
        rotationY: 0,
        scale: top ? 1 : 1 - depth * 0.02,
        zIndex: 1000 - p,
        autoAlpha: p <= VIS ? 1 : 0,
        transformOrigin: "center center",
      };
    };
    function layout(animate, skipTop) {
      order.forEach((idx, p) => {
        const tgt = pageEls[idx];
        tgt.style.pointerEvents = p === 0 ? "auto" : "none";
        if (skipTop && p === 0) return;
        const v = varsFor(idx, p);
        animate ? gsap.to(tgt, { ...v, duration: 0.5, ease: "power3.out" }) : gsap.set(tgt, v);
      });
    }
    const updateCounter = () => { if (counterEl) counterEl.textContent = `${pad(order[0] + 1)} / ${N}`; };

    // rapid wrapper straighten on top-page hover (children flatten via CSS)
    let hovered = null;
    pageEls.forEach((pg) => {
      pg.addEventListener("mouseenter", () => {
        if (pg.style.pointerEvents === "none") return;
        hovered = pg;
        gsap.to(pg, { rotation: 0, y: -12, scale: 1.05, duration: 0.16, ease: "power2.out", overwrite: "auto" });
      });
      pg.addEventListener("mouseleave", () => {
        if (hovered !== pg) return;
        hovered = null;
        gsap.to(pg, { ...varsFor(order[0], 0), duration: 0.3, ease: "power2.out", overwrite: "auto" });
      });
      pg.addEventListener("click", (e) => {
        if (e.target.closest("[data-exp]")) return;
        flip(1);
      });
      pg.querySelector("[data-exp]").addEventListener("click", (e) => {
        e.stopPropagation(); openLightbox(files, order[0], meta);
      });
    });

    function flip(dir) {
      if (busy || N < 2) return;
      busy = true; hovered = null;
      if (dir > 0) {
        const leaving = pageEls[order[0]];
        gsap.to(leaving, {
          rotationY: -158, x: "-58%", autoAlpha: 0, duration: 0.55,
          ease: "power2.in", transformOrigin: "left center",
          onComplete: () => {
            order.push(order.shift());
            gsap.set(leaving, { rotationY: 0, x: 0 });
            layout(true); updateCounter(); busy = false;
          },
        });
      } else {
        order.unshift(order.pop());
        const incoming = pageEls[order[0]];
        gsap.set(incoming, { zIndex: 1500, rotationY: -158, x: "-58%", autoAlpha: 0, transformOrigin: "left center" });
        layout(true, true); // settle the rest of the pile
        gsap.to(incoming, {
          rotationY: 0, x: 0, autoAlpha: 1, duration: 0.55, ease: "power2.out",
          onComplete: () => { gsap.set(incoming, { zIndex: 1000 }); updateCounter(); busy = false; },
        });
      }
    }
    if (nav2) nav2.querySelectorAll(".book__btn").forEach((b) =>
      b.addEventListener("click", () => flip(+b.dataset.dir)));

    layout(false);
    updateCounter();

    // intro: the pile drops/settles into place
    gsap.from(book.children, {
      y: 46, autoAlpha: 0, rotationX: -35, transformOrigin: "50% 100%",
      duration: 0.7, ease: "back.out(1.3)", stagger: 0.035,
    });
    gsap.from(stage.querySelector(".stage__head").children,
      { y: 18, autoAlpha: 0, duration: 0.6, ease: "expo.out", stagger: 0.05 });
  }

  function select(meta, btn) {
    if (current === meta) return;
    setActiveNav(btn);
    const finish = () => { renderStage(meta); current = meta; if (window.ScrollTrigger) ScrollTrigger.refresh(); };
    const old = stage.children.length ? [...stage.children] : null;
    if (gsapOK && old) {
      gsap.to(old, { autoAlpha: 0, y: 14, duration: 0.26, ease: "power2.in", onComplete: finish });
    } else finish();
  }

  // initial render (first category)
  const firstBtn = allItems[0];
  setActiveNav(firstBtn);
  renderStage(firstBtn._meta);
  current = firstBtn._meta;

  // ---------------------------------------------------------
  //  LIGHTBOX (pages through the whole category)
  // ---------------------------------------------------------
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  const lbClose = document.getElementById("lbClose");
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");
  let lbFiles = [], lbIdx = 0, lbMeta = null;

  function show(i) {
    lbIdx = (i + lbFiles.length) % lbFiles.length;
    const file = lbFiles[lbIdx];
    lbImg.src = BASE + file;
    lbImg.alt = caption(file);
    lbCap.innerHTML = `<strong>${lbMeta ? lbMeta.title : ""}</strong> · ${caption(file)} <span class="lb__counter">${lbIdx + 1}/${lbFiles.length}</span>`;
  }
  function openLightbox(files, idx, meta) {
    lbFiles = files; lbMeta = meta; show(idx);
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    if (window.__lenis) window.__lenis.stop();
  }
  function close() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    if (window.__lenis) window.__lenis.start();
  }
  lbClose.addEventListener("click", close);
  lbPrev.addEventListener("click", () => show(lbIdx - 1));
  lbNext.addEventListener("click", () => show(lbIdx + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  window.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(lbIdx - 1);
    else if (e.key === "ArrowRight") show(lbIdx + 1);
  });
})();
