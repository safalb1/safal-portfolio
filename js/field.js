// ============================================================
//  FIELD WORK — domain toggle, scroll reveals & lightbox
// ============================================================
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const section = document.getElementById("field");
  if (!section) return;

  const tabs   = [...section.querySelectorAll(".field__tab")];
  const thumb  = section.querySelector(".field__thumb");
  const panels = [...section.querySelectorAll(".field__panel")];
  const hasGsap = window.gsap && window.ScrollTrigger && !prefersReduced;

  // ---------------------------------------------------------
  //  SLIDING TOGGLE
  // ---------------------------------------------------------
  function placeThumb(tab) {
    thumb.style.left = tab.offsetLeft + "px";
    thumb.style.width = tab.offsetWidth + "px";
  }
  const activeTab = () => tabs.find((t) => t.classList.contains("is-active")) || tabs[0];

  function activate(domain) {
    tabs.forEach((t) => {
      const on = t.dataset.domain === domain;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    placeThumb(activeTab());

    panels.forEach((p) => {
      const on = p.dataset.panel === domain;
      if (on) {
        p.classList.add("is-active");
        // re-trigger the entrance animation
        p.classList.remove("is-anim");
        void p.offsetWidth;            // reflow so the animation restarts
        p.classList.add("is-anim");
        revealShots(p, true);
      } else {
        p.classList.remove("is-active", "is-anim");
      }
    });

    buildLightboxList();
    if (hasGsap) ScrollTrigger.refresh();
  }

  tabs.forEach((t) =>
    t.addEventListener("click", () => activate(t.dataset.domain))
  );
  window.addEventListener("load", () => placeThumb(activeTab()));
  window.addEventListener("resize", () => placeThumb(activeTab()));
  placeThumb(activeTab());

  // ---------------------------------------------------------
  //  SCROLL REVEALS  (cat heads + screenshot cards)
  // ---------------------------------------------------------
  const allShots = [...section.querySelectorAll(".shot")];
  const allHeads = [...section.querySelectorAll(".cat__head")];

  if (hasGsap) {
    gsap.set([...allShots, ...allHeads], { opacity: 0, y: 34 });

    // for the panel visible on first load, reveal on scroll
    const initial = section.querySelector(".field__panel.is-active");
    initial && initial.querySelectorAll(".cat").forEach((cat) => {
      gsap.to(cat.querySelectorAll(".cat__head, .shot"), {
        opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.09,
        scrollTrigger: { trigger: cat, start: "top 85%" },
      });
    });
  }

  // reveal a panel's cards (used when toggling to a panel)
  function revealShots(panel, immediate) {
    if (!hasGsap) return;
    const items = panel.querySelectorAll(".cat__head, .shot");
    gsap.fromTo(
      items,
      { opacity: 0, y: 34 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: "expo.out",
        stagger: 0.07, delay: immediate ? 0.12 : 0,
        overwrite: true,
      }
    );
  }

  // ---------------------------------------------------------
  //  LIGHTBOX
  // ---------------------------------------------------------
  const lb    = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCap = document.getElementById("lbCap");
  const lbClose = document.getElementById("lbClose");
  const lbPrev  = document.getElementById("lbPrev");
  const lbNext  = document.getElementById("lbNext");
  let shots = [];
  let idx = 0;

  function buildLightboxList() {
    const panel = section.querySelector(".field__panel.is-active");
    shots = [...panel.querySelectorAll(".shot")];
  }
  buildLightboxList();

  function show(i) {
    idx = (i + shots.length) % shots.length;
    const s = shots[idx];
    lbImg.src = s.dataset.full;
    lbImg.alt = s.querySelector("img")?.alt || "";
    lbCap.innerHTML = s.dataset.cap || "";
  }
  function open(s) {
    idx = shots.indexOf(s);
    show(idx);
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

  allShots.forEach((s) =>
    s.addEventListener("click", () => { buildLightboxList(); open(s); })
  );
  lbClose.addEventListener("click", close);
  lbPrev.addEventListener("click", () => show(idx - 1));
  lbNext.addEventListener("click", () => show(idx + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  window.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(idx - 1);
    else if (e.key === "ArrowRight") show(idx + 1);
  });
})();
