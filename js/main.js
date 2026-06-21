// ============================================================
//  MAIN — GSAP / Lenis / cursor / preloader / reveals
// ============================================================
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------------------------------------------------------
  //  PRELOADER
  // ---------------------------------------------------------
  const preloader = document.getElementById("preloader");
  const loadNum = document.getElementById("loadNum");
  const loadBar = document.getElementById("loadBar");
  let progress = 0;
  let ready = false;
  window.addEventListener("cosmos-ready", () => (ready = true));

  const loadInt = setInterval(() => {
    const cap = ready ? 100 : 90;
    progress += Math.random() * (ready ? 14 : 5);
    if (progress > cap) progress = cap;
    loadNum.textContent = Math.floor(progress);
    loadBar.style.width = progress + "%";
    if (progress >= 100) {
      clearInterval(loadInt);
      setTimeout(revealSite, 350);
    }
  }, 90);

  function revealSite() {
    preloader.classList.add("done");
    startIntro();
  }

  // ---------------------------------------------------------
  //  CUSTOM CURSOR
  // ---------------------------------------------------------
  const cursor = document.getElementById("cursor");
  const dot = document.getElementById("cursorDot");
  let cx = 0, cy = 0, dx = 0, dy = 0;
  window.addEventListener("pointermove", (e) => {
    dx = e.clientX; dy = e.clientY;
    dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
  });
  (function cursorLoop() {
    cx += (dx - cx) * 0.18;
    cy += (dy - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(cursorLoop);
  })();
  document.querySelectorAll('[data-cursor="hover"]').forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });

  // ---------------------------------------------------------
  //  LENIS SMOOTH SCROLL
  // ---------------------------------------------------------
  let lenis;
  if (window.Lenis && !prefersReduced) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", () => { if (window.ScrollTrigger) ScrollTrigger.update(); });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    // anchor links
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length > 1) { e.preventDefault(); lenis.scrollTo(id, { offset: 0 }); }
      });
    });
  }

  // scroll progress bar
  const sp = document.getElementById("scrollProgress");
  window.addEventListener("scroll", () => {
    const max = document.body.scrollHeight - window.innerHeight;
    sp.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
  });

  // ---------------------------------------------------------
  //  INTRO ANIMATION
  // ---------------------------------------------------------
  function startIntro() {
    if (prefersReduced || !window.gsap) {
      document.querySelectorAll(".reveal-up").forEach((el) => (el.style.opacity = 1));
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.to(".hero__title .word", { y: 0, duration: 1.3, stagger: 0.12 }, 0.1)
      .to(".hero__eyebrow", { opacity: 1, y: 0, duration: 1 }, 0.3)
      .to(".hero__sub", { opacity: 1, y: 0, duration: 1 }, 0.6)
      .to(".hero__scroll", { opacity: 1, y: 0, duration: 1 }, 0.8)
      .fromTo(".hero__meta span", { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.8, stagger: 0.1 }, 0.9);
  }

  // ---------------------------------------------------------
  //  SCROLLTRIGGER REVEALS + THEME SWITCH
  // ---------------------------------------------------------
  if (window.gsap && window.ScrollTrigger && !prefersReduced) {
    gsap.registerPlugin(ScrollTrigger);

    // generic fade-up
    gsap.utils.toArray(".reveal-up").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // line/word reveals (about lead, section titles, contact)
    gsap.utils.toArray(".reveal-line, .section__title, .contact__title").forEach((el) => {
      const words = el.querySelectorAll(".word");
      const targets = words.length ? words : [el];
      if (!words.length) gsap.set(el, { opacity: 0, y: 40 });
      gsap.to(targets, {
        y: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.08,
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // stat counters
    gsap.utils.toArray(".stat__num").forEach((el) => {
      const end = +el.dataset.count;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 2, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: () => (el.textContent = Math.floor(obj.v)),
      });
    });

    // marquee scroll-velocity skew
    gsap.utils.toArray(".marquee__track").forEach((track) => {
      gsap.to(track, {
        xPercent: -50, repeat: -1, duration: 22, ease: "none",
      });
    });

    // theme switch per section
    ["hero", "about", "work", "skills", "contact"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el, start: "top 55%", end: "bottom 55%",
        onEnter: () => window.__setCosmosTheme && window.__setCosmosTheme(id),
        onEnterBack: () => window.__setCosmosTheme && window.__setCosmosTheme(id),
      });
    });

    // amp up the core distortion on contact section
    ScrollTrigger.create({
      trigger: "#contact", start: "top 60%",
      onEnter: () => window.__setCosmosAmp && window.__setCosmosAmp(0.85),
      onLeaveBack: () => window.__setCosmosAmp && window.__setCosmosAmp(0.45),
    });

    // nav hide on scroll down, show on up
    let lastY = 0;
    const nav = document.getElementById("nav");
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        gsap.to(nav, { yPercent: y > lastY && y > 200 ? -130 : 0, duration: 0.5, ease: "power2.out" });
        lastY = y;
      },
    });
  } else {
    // fallback: just show everything
    document.querySelectorAll(".reveal-up, .word").forEach((el) => {
      el.style.opacity = 1; el.style.transform = "none";
    });
  }
})();
