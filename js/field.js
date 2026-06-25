// ============================================================
//  FIELD WORK — master/detail: categories left, wrinkled-paper cards right.
//  Hovering a card un-crumples it into a clean sheet; switching a category
//  plays a 3D paper-unfold. Data from js/field-data.js (window.FIELD_SHOTS).
// ============================================================
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const section = document.getElementById("field");
  if (!section || !window.FIELD_SHOTS) return;

  const SHOTS = window.FIELD_SHOTS;
  const BASE = "assets/work/";
  const gsapOK = window.gsap && !prefersReduced;
  const nav = section.querySelector(".field__nav");
  const stage = section.querySelector(".field__stage");
  if (!nav || !stage) return;

  // ---- domains + category metadata ----
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
    root.querySelectorAll("[data-cursor='hover']").forEach((el2) => {
      el2.addEventListener("mouseenter", () => cursorEl.classList.add("is-hover"));
      el2.addEventListener("mouseleave", () => cursorEl.classList.remove("is-hover"));
    });
  }
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const rand = (a, b) => a + Math.random() * (b - a);

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

  function setActiveNav(btn) {
    allItems.forEach((b) => b.classList.toggle("is-on", b === btn));
  }

  // ---------------------------------------------------------
  //  RIGHT STAGE
  // ---------------------------------------------------------
  function renderStage(meta) {
    const files = SHOTS[meta.id] || [];
    stage.innerHTML = "";

    const head = el("div", "stage__head",
      `<span class="stage__no">${meta.no}</span>
       <h3>${meta.title}</h3>
       <p>${meta.desc}</p>
       <span class="stage__count">${files.length} ${files.length === 1 ? "capture" : "captures"}</span>`);
    stage.appendChild(head);

    const grid = el("div", "stage__grid");
    files.forEach((file, idx) => {
      const cap = caption(file);
      const card = el("button", "paper",
        `<span class="paper__sheet">
           <img src="${BASE}${file}" alt="${cap.replace(/"/g, "&quot;")}" loading="lazy" />
           <span class="paper__tape" aria-hidden="true"></span>
           <span class="paper__tag">${cap}</span>
           <span class="paper__exp" aria-hidden="true">↗</span>
         </span>`);
      card.style.setProperty("--rot", rand(-3.2, 3.2).toFixed(2) + "deg");
      card.setAttribute("data-cursor", "hover");
      card.addEventListener("click", () => openLightbox(files, idx, meta));
      grid.appendChild(card);
    });
    stage.appendChild(grid);

    if (meta.pdf) {
      const a = el("a", "field__pdf",
        `View full annotation case study <span aria-hidden="true">↗ PDF</span>`);
      a.href = meta.pdf; a.target = "_blank"; a.rel = "noopener";
      a.setAttribute("data-cursor", "hover");
      stage.appendChild(a);
    }
    bindCursor(stage);
  }

  function animateIn() {
    if (!gsapOK) return;
    const head = stage.querySelector(".stage__head");
    const papers = stage.querySelectorAll(".paper");
    const pdf = stage.querySelector(".field__pdf");
    if (head) gsap.fromTo(head.children,
      { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: "expo.out", stagger: 0.05, overwrite: true });
    gsap.fromTo(papers,
      { opacity: 0, y: 36, scale: 0.55, rotationZ: () => rand(-14, 14), rotationX: -55,
        transformOrigin: "50% 100%", filter: "blur(7px) brightness(0.35)" },
      { opacity: 1, y: 0, scale: 1, rotationZ: 0, rotationX: 0, filter: "blur(0px) brightness(1)",
        duration: 0.85, ease: "back.out(1.35)", stagger: { each: 0.045, from: "start" }, overwrite: true,
        clearProps: "transform,filter" });
    if (pdf) gsap.fromTo(pdf, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.3 });
  }

  function select(meta, btn) {
    if (current === meta) return;
    setActiveNav(btn);
    const grid = stage.querySelector(".stage__grid");
    const papers = grid ? [...grid.querySelectorAll(".paper")] : [];
    const swap = () => { renderStage(meta); animateIn(); current = meta;
      if (window.ScrollTrigger) ScrollTrigger.refresh(); };
    if (gsapOK && papers.length) {
      gsap.to(papers, {
        opacity: 0, scale: 0.6, y: 16, rotationZ: () => rand(-12, 12), rotationX: -40,
        transformOrigin: "50% 100%", filter: "blur(6px) brightness(0.5)",
        duration: 0.3, ease: "power2.in", stagger: { each: 0.02, from: "end" }, onComplete: swap,
      });
    } else swap();
  }

  // initial: first category, rendered at rest; unfold once when scrolled into view
  const firstBtn = allItems[0];
  setActiveNav(firstBtn);
  renderStage(firstBtn._meta);
  current = firstBtn._meta;
  if (gsapOK && window.ScrollTrigger) {
    ScrollTrigger.create({ trigger: stage, start: "top 82%", once: true, onEnter: animateIn });
  }

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
