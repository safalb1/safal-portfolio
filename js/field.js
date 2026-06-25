// ============================================================
//  FIELD WORK — dynamic paginated galleries, domain toggle & lightbox
//  Data comes from js/field-data.js (window.FIELD_SHOTS)
// ============================================================
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const section = document.getElementById("field");
  if (!section || !window.FIELD_SHOTS) return;

  const SHOTS = window.FIELD_SHOTS;
  const BASE = "assets/work/";
  const PAGE = 6; // tiles per page
  const gsapOK = window.gsap && !prefersReduced;

  // ---- category metadata (titles / blurbs / order, per domain) ----
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

  // hand-written captions for the annotation slides; everything else is auto
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

  // make the custom cursor swell over dynamically-created elements
  const cursorEl = document.getElementById("cursor");
  function bindCursor(root) {
    if (!cursorEl) return;
    root.querySelectorAll("[data-cursor='hover']").forEach((el) => {
      el.addEventListener("mouseenter", () => cursorEl.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursorEl.classList.remove("is-hover"));
    });
  }

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // ---------------------------------------------------------
  //  RENDER ONE CATEGORY (with page-by-page pagination)
  // ---------------------------------------------------------
  function renderCat(meta) {
    const files = SHOTS[meta.id] || [];
    const pages = Math.max(1, Math.ceil(files.length / PAGE));
    let page = 0;

    const art = el("article", "cat");
    art.appendChild(el("header", "cat__head",
      `<span class="cat__no">${meta.no}</span>
       <h3>${meta.title}</h3>
       <p>${meta.desc}</p>
       <span class="cat__count">${files.length} ${files.length === 1 ? "capture" : "captures"}</span>`));

    const grid = el("div", "cat__grid");
    art.appendChild(grid);

    if (meta.pdf) {
      const a = el("a", "field__pdf",
        `View full annotation case study <span aria-hidden="true">↗ PDF</span>`);
      a.href = meta.pdf; a.target = "_blank"; a.rel = "noopener";
      a.setAttribute("data-cursor", "hover");
      art.appendChild(a);
    }

    // pager (only if more than one page)
    const pager = el("div", "cat__pager");
    if (pages > 1) art.appendChild(pager);

    function drawGrid(animate) {
      grid.innerHTML = "";
      const start = page * PAGE;
      files.slice(start, start + PAGE).forEach((file, i) => {
        const idx = start + i;
        const cap = caption(file);
        const btn = el("button", "shot",
          `<img src="${BASE}${file}" alt="${cap.replace(/"/g, "&quot;")}" loading="lazy" />
           <span class="shot__tag">${cap}</span><span class="shot__exp" aria-hidden="true">↗</span>`);
        btn.setAttribute("data-cursor", "hover");
        btn.addEventListener("click", () => openLightbox(files, idx, meta));
        grid.appendChild(btn);
      });
      bindCursor(grid);
      if (gsapOK && animate) {
        gsap.fromTo(grid.children, { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.55, ease: "expo.out", stagger: 0.05, overwrite: true });
      }
    }

    function drawPager() {
      if (pages <= 1) return;
      pager.innerHTML = "";
      const prev = el("button", "pager__arrow", "‹");
      const next = el("button", "pager__arrow", "›");
      prev.setAttribute("aria-label", "Previous page");
      next.setAttribute("aria-label", "Next page");
      prev.setAttribute("data-cursor", "hover");
      next.setAttribute("data-cursor", "hover");
      const go = (p) => { page = (p + pages) % pages; drawGrid(true); drawPager(); };
      prev.addEventListener("click", () => go(page - 1));
      next.addEventListener("click", () => go(page + 1));

      const dots = el("div", "pager__dots");
      for (let i = 0; i < pages; i++) {
        const d = el("button", "pager__dot" + (i === page ? " is-on" : ""));
        d.setAttribute("aria-label", "Page " + (i + 1));
        d.setAttribute("data-cursor", "hover");
        d.addEventListener("click", () => go(i));
        dots.appendChild(d);
      }
      const label = el("span", "pager__count", `${page + 1} / ${pages}`);
      pager.appendChild(prev);
      pager.appendChild(dots);
      pager.appendChild(label);
      pager.appendChild(next);
      bindCursor(pager);
    }

    drawGrid(false);
    drawPager();
    return art;
  }

  // ---------------------------------------------------------
  //  BUILD PANELS
  // ---------------------------------------------------------
  const panels = {};
  ["ai", "cv"].forEach((dom) => {
    const panel = section.querySelector(`.field__panel[data-panel="${dom}"]`);
    panels[dom] = panel;
    if (!panel) return;
    CATS[dom].forEach((meta) => panel.appendChild(renderCat(meta)));
  });

  // ---------------------------------------------------------
  //  DOMAIN TOGGLE (sliding pill + crossfade)
  // ---------------------------------------------------------
  const tabs = [...section.querySelectorAll(".field__tab")];
  const thumb = section.querySelector(".field__thumb");
  const activeTab = () => tabs.find((t) => t.classList.contains("is-active")) || tabs[0];

  function placeThumb(tab) {
    if (!thumb || !tab) return;
    thumb.style.left = tab.offsetLeft + "px";
    thumb.style.width = tab.offsetWidth + "px";
  }

  function activate(dom) {
    tabs.forEach((t) => {
      const on = t.dataset.domain === dom;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    placeThumb(activeTab());
    Object.entries(panels).forEach(([k, p]) => {
      if (!p) return;
      const on = k === dom;
      p.classList.toggle("is-active", on);
      if (on) {
        p.classList.remove("is-anim"); void p.offsetWidth; p.classList.add("is-anim");
        if (gsapOK) gsap.fromTo(p.querySelectorAll(".cat__head, .shot"),
          { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.05, overwrite: true });
      }
    });
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  tabs.forEach((t) => t.addEventListener("click", () => activate(t.dataset.domain)));
  window.addEventListener("load", () => placeThumb(activeTab()));
  window.addEventListener("resize", () => placeThumb(activeTab()));
  placeThumb(activeTab());

  // first-load reveal for the visible panel
  if (gsapOK && window.ScrollTrigger) {
    const initial = section.querySelector(".field__panel.is-active");
    initial && initial.querySelectorAll(".cat").forEach((cat) => {
      gsap.set(cat.querySelectorAll(".cat__head, .shot"), { opacity: 0, y: 30 });
      gsap.to(cat.querySelectorAll(".cat__head, .shot"), {
        opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06,
        scrollTrigger: { trigger: cat, start: "top 86%" },
      });
    });
  }

  // ---------------------------------------------------------
  //  LIGHTBOX  (pages through an entire category)
  // ---------------------------------------------------------
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  const lbClose = document.getElementById("lbClose");
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");
  let lbFiles = [];
  let lbIdx = 0;
  let lbMeta = null;

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
