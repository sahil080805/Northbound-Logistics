/**
 * main.js — behaviour shared by every page:
 * mobile menu, sticky-header shadow, current-page highlight,
 * scroll-reveal, animated counters, footer year, quick-track box.
 */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Mobile navigation ------------------------------------------------ */
  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");
  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
  }
  toggle?.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  $$(".nav__link, .mobile-cta", nav || document).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 980) setMenu(false); });

  /* Header shadow once the page scrolls ------------------------------- */
  const header = $(".site-header");
  const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Highlight the current page (driven by <body data-page="...">) ------ */
  const page = document.body.dataset.page;
  $$(".nav__link").forEach((a) => {
    if (a.dataset.page === page) a.setAttribute("aria-current", "page");
  });

  /* Scroll reveal ----------------------------------------------------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* Animated counters ------------------------------------------------- */
  const counters = $$("[data-count]");
  const fmt = (n, dec) => n.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  function run(el) {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.firstChild.textContent = fmt(end * eased, dec);
      if (p < 1) requestAnimationFrame(tick);
      else el.firstChild.textContent = fmt(end, dec);
    };
    el.firstChild.textContent = fmt(0, dec);
    if (suffix && !el.querySelector("sup")) el.insertAdjacentHTML("beforeend", `<sup>${suffix}</sup>`);
    requestAnimationFrame(tick);
  }
  if (counters.length && "IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach((c) => co.observe(c));
  }

  /* Footer year ------------------------------------------------------- */
  $$(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* Home page quick-track box → tracking page ------------------------- */
  const quick = $("#quick-track");
  quick?.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("input", quick);
    const id = input.value.trim().toUpperCase();
    const err = $(".qt-error", quick);
    if (!/^NB\d{7}$/.test(id)) {
      err.textContent = "Enter a valid ID, e.g. NB1024002 (NB + 7 digits).";
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }
    window.location.href = "tracking.html?id=" + encodeURIComponent(id);
  });
})();
