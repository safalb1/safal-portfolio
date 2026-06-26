// ============================================================
//  FIELD WORK — categories left; right side is a STACK of screenshots
//  laid like the pages of a (coverless) book. Pages rest crumpled and
//  un-crumple on hover; click opens the lightbox; ‹ › flip.
//
//  ACCESS LOCK: the work files ship AES-encrypted (assets/work/enc/*.enc).
//  Until a visitor enters the passphrase (shared by Safal after approving an
//  emailed request), files show frosted + locked and clicks open a request
//  email. Titles stay visible. Config: window.LOCK (js/lock-config.js).
// ============================================================
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const section = document.getElementById("field");
  if (!section || !window.FIELD_SHOTS) return;

  const SHOTS = window.FIELD_SHOTS;
  const BASE = "assets/work/";
  const gsapOK = window.gsap && !prefersReduced;
  const VIS = 5;
  const nav = section.querySelector(".field__nav");
  const stage = section.querySelector(".field__stage");
  if (!nav || !stage) return;

  // ---------------------------------------------------------
  //  ACCESS LOCK (AES-GCM, passphrase-derived key)
  // ---------------------------------------------------------
  const LOCK = window.LOCK || null;
  let unlocked = !LOCK;          // no config => behave as open (dev fallback)
  let KEY = null;                // CryptoKey once the passphrase is verified
  const blobCache = {};          // file -> object URL
  const PDF_FILE = "data-annotation-casestudy.pdf";
  const b64ToBytes = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));

  async function deriveKey(pass) {
    const baseKey = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64ToBytes(LOCK.salt), iterations: LOCK.iter, hash: "SHA-256" },
      baseKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  }
  async function decryptBytes(bytes) {
    const iv = bytes.slice(0, 12), ct = bytes.slice(12);
    return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, KEY, ct));
  }
  async function tryUnlock(pass) {
    try {
      KEY = await deriveKey(pass);
      const v = b64ToBytes(LOCK.verifier);
      await crypto.subtle.decrypt({ name: "AES-GCM", iv: v.slice(0, 12) }, KEY, v.slice(12));
      unlocked = true;
      return true;
    } catch (e) { KEY = null; return false; }
  }
  async function getSrc(file) {
    if (!LOCK) return BASE + file;
    if (blobCache[file]) return blobCache[file];
    if (!unlocked || !KEY) return null;
    const buf = new Uint8Array(await (await fetch(LOCK.enc + file + ".enc")).arrayBuffer());
    const plain = await decryptBytes(buf);
    const ext = file.split(".").pop().toLowerCase();
    const mime = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
    return (blobCache[file] = URL.createObjectURL(new Blob([plain], { type: mime })));
  }
  function requestAccess() {
    const email = (LOCK && LOCK.email) || "safbhalerao@gmail.com";
    const subject = encodeURIComponent("Access request — work samples");
    const body = encodeURIComponent(
      "Hi Safal,\n\nI'd like to view your locked Data Annotation / AI-Trainer work samples on your portfolio. " +
      "Could you please share the access passphrase?\n\nThanks,");
    window.location.href = "mailto:" + email + "?subject=" + subject + "&body=" + body;
  }
  async function fillImg(img) {
    const src = await getSrc(img.dataset.file);
    if (src) img.src = src;
  }

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
        pdf: PDF_FILE },
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
  //  LOCK BAR (request access + passphrase to unlock)
  // ---------------------------------------------------------
  let lockBar = null;
  function buildLockBar() {
    if (!LOCK) return;
    lockBar = el("div", "field__lock",
      `<span class="field__lock__ico" aria-hidden="true">🔒</span>
       <p class="field__lock__msg">These work files are private. <strong>Request access</strong> and I'll share the passphrase once approved — titles stay visible.</p>
       <div class="field__lock__row">
         <button type="button" class="field__lock__req" data-cursor="hover">Request access ↗</button>
         <form class="field__lock__form">
           <input type="password" class="field__lock__input" placeholder="Access passphrase" aria-label="Access passphrase" autocomplete="off" />
           <button type="submit" class="field__lock__go" data-cursor="hover">Unlock</button>
         </form>
       </div>
       <span class="field__lock__status" aria-live="polite"></span>`);
    const layout = section.querySelector(".field__layout");
    section.insertBefore(lockBar, layout);
    bindCursor(lockBar);

    lockBar.querySelector(".field__lock__req").addEventListener("click", requestAccess);
    const status = lockBar.querySelector(".field__lock__status");
    lockBar.querySelector(".field__lock__form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const pass = lockBar.querySelector(".field__lock__input").value.trim();
      if (!pass) return;
      status.textContent = "Checking…";
      if (await tryUnlock(pass)) {
        try { sessionStorage.setItem("fieldPass", pass); } catch (_) {}
        reveal();
      } else {
        status.textContent = "Incorrect passphrase.";
        lockBar.classList.add("shake");
        setTimeout(() => lockBar.classList.remove("shake"), 500);
      }
    });
  }
  function reveal() {
    unlocked = true;
    document.querySelectorAll(".book").forEach((b) => b.classList.remove("is-locked"));
    section.querySelectorAll(".field__stage img[data-file]").forEach(fillImg);
    if (lockBar) lockBar.classList.add("is-gone");
  }

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

    const book = el("div", "book" + (gsapOK ? "" : " is-static") + (unlocked ? "" : " is-locked"));
    const restRot = [];
    const pageEls = files.map((file, i) => {
      restRot[i] = rand(-4, 4);
      const cap = caption(file);
      const pg = el("button", "page",
        `<span class="page__sheet">
           <img data-file="${file}" alt="${cap.replace(/"/g, "&quot;")}" loading="lazy" />
           <span class="page__crump" aria-hidden="true"></span>
           <span class="page__lock" aria-hidden="true"><span class="page__lock-ico">🔒</span></span>
           <span class="page__tag">${cap}</span>
           <span class="page__exp" aria-hidden="true" data-exp>↗</span>
         </span>`);
      pg.setAttribute("data-cursor", "hover");
      book.appendChild(pg);
      if (unlocked) fillImg(pg.querySelector("img"));
      return pg;
    });
    stage.appendChild(book);

    let nav2 = null, counterEl = null;
    if (N > 1 && gsapOK) {
      nav2 = el("div", "book__nav",
        `<button class="book__btn" data-dir="-1" aria-label="Previous page">‹</button>
         <span class="book__counter"></span>
         <button class="book__btn" data-dir="1" aria-label="Next page">›</button>
         <span class="book__hint">click page to open · ‹ › to flip</span>`);
      stage.appendChild(nav2);
      counterEl = nav2.querySelector(".book__counter");
    }

    if (meta.pdf) {
      const a = el("a", "field__pdf",
        `View full annotation case study <span aria-hidden="true">↗ PDF</span>`);
      a.href = "#"; a.setAttribute("data-cursor", "hover");
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!unlocked) return requestAccess();
        const url = await getSrc(meta.pdf);
        if (url) window.open(url, "_blank", "noopener");
      });
      stage.appendChild(a);
    }
    bindCursor(stage);

    const onActivate = (i) => () => { if (!unlocked) requestAccess(); else openLightbox(files, i, meta); };

    if (!gsapOK) {
      pageEls.forEach((pg, i) => {
        pg.querySelector("[data-exp]").addEventListener("click", (e) => { e.stopPropagation(); onActivate(i)(); });
        pg.addEventListener("click", onActivate(i));
      });
      return;
    }

    // ---- animated stack ----
    let order = files.map((_, i) => i);
    let busy = false;

    const varsFor = (idx, p) => {
      const depth = Math.min(p, VIS), top = p === 0;
      return {
        x: top ? 0 : depth * 7, y: top ? 0 : depth * 9, rotation: restRot[idx], rotationY: 0,
        scale: top ? 1 : 1 - depth * 0.02, zIndex: 1000 - p,
        autoAlpha: p <= VIS ? 1 : 0, transformOrigin: "center center",
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

    let hovered = null;
    pageEls.forEach((pg, i) => {
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
      pg.addEventListener("click", () => onActivate(order[0])());
      pg.querySelector("[data-exp]").addEventListener("click", (e) => { e.stopPropagation(); onActivate(order[0])(); });
    });

    function flip(dir) {
      if (busy || N < 2) return;
      busy = true; hovered = null;
      if (dir > 0) {
        const leaving = pageEls[order[0]];
        gsap.to(leaving, {
          rotationY: -158, x: "-58%", autoAlpha: 0, duration: 0.55, ease: "power2.in", transformOrigin: "left center",
          onComplete: () => { order.push(order.shift()); gsap.set(leaving, { rotationY: 0, x: 0 }); layout(true); updateCounter(); busy = false; },
        });
      } else {
        order.unshift(order.pop());
        const incoming = pageEls[order[0]];
        gsap.set(incoming, { zIndex: 1500, rotationY: -158, x: "-58%", autoAlpha: 0, transformOrigin: "left center" });
        layout(true, true);
        gsap.to(incoming, { rotationY: 0, x: 0, autoAlpha: 1, duration: 0.55, ease: "power2.out",
          onComplete: () => { gsap.set(incoming, { zIndex: 1000 }); updateCounter(); busy = false; } });
      }
    }
    if (nav2) nav2.querySelectorAll(".book__btn").forEach((b) => b.addEventListener("click", () => flip(+b.dataset.dir)));

    layout(false);
    updateCounter();
    gsap.from(book.children, { y: 46, autoAlpha: 0, rotationX: -35, transformOrigin: "50% 100%", duration: 0.7, ease: "back.out(1.3)", stagger: 0.035 });
    gsap.from(stage.querySelector(".stage__head").children, { y: 18, autoAlpha: 0, duration: 0.6, ease: "expo.out", stagger: 0.05 });
  }

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

  function select(meta, btn) {
    if (current === meta) return;
    setActiveNav(btn);
    const finish = () => { renderStage(meta); current = meta; if (window.ScrollTrigger) ScrollTrigger.refresh(); };
    const old = stage.children.length ? [...stage.children] : null;
    if (gsapOK && old) gsap.to(old, { autoAlpha: 0, y: 14, duration: 0.26, ease: "power2.in", onComplete: finish });
    else finish();
  }

  buildLockBar();
  const firstBtn = allItems[0];
  setActiveNav(firstBtn);
  renderStage(firstBtn._meta);
  current = firstBtn._meta;

  // auto-unlock for the session if the passphrase was already entered
  if (LOCK) {
    let saved = null;
    try { saved = sessionStorage.getItem("fieldPass"); } catch (_) {}
    if (saved) tryUnlock(saved).then((ok) => { if (ok) reveal(); });
  }

  // ---------------------------------------------------------
  //  LIGHTBOX
  // ---------------------------------------------------------
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  const lbClose = document.getElementById("lbClose");
  const lbPrev = document.getElementById("lbPrev");
  const lbNext = document.getElementById("lbNext");
  let lbFiles = [], lbIdx = 0, lbMeta = null;

  async function show(i) {
    lbIdx = (i + lbFiles.length) % lbFiles.length;
    const file = lbFiles[lbIdx];
    lbImg.removeAttribute("src");
    const url = await getSrc(file);
    if (url) lbImg.src = url;
    lbImg.alt = caption(file);
    lbCap.innerHTML = `<strong>${lbMeta ? lbMeta.title : ""}</strong> · ${caption(file)} <span class="lb__counter">${lbIdx + 1}/${lbFiles.length}</span>`;
  }
  function openLightbox(files, idx, meta) {
    if (!unlocked) return requestAccess();
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
