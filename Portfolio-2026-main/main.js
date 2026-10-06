(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Loader ---------- */
  const loader = $("#loading-screen");
  let loaderHidden = false;
  const hideLoader = () => {
    if (loaderHidden || !loader) return;
    loaderHidden = true;
    loader.classList.add("done");
    setTimeout(() => loader.remove(), 700);
  };
  // Show for a short moment, but never block the page for long
  window.addEventListener("load", () => setTimeout(hideLoader, reduceMotion ? 100 : 2300));
  setTimeout(hideLoader, 4500);
  loader && loader.addEventListener("click", hideLoader);

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const themeBtn = $("#theme-toggle");
  const setTheme = (t) => {
    root.setAttribute("data-theme", t);
    themeBtn.innerHTML = t === "dark" ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#0b0d17" : "#f6f7fd");
  };
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) { /* storage blocked */ }
  setTheme(saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
  themeBtn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("theme", next); } catch (e) { /* ignore */ }
  });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menu-toggle");
  const navLinksWrap = $("#nav-links");
  const closeMenu = () => {
    navLinksWrap.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
  };
  menuBtn.addEventListener("click", () => {
    const open = navLinksWrap.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  });
  $$("a", navLinksWrap).forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav")) closeMenu();
  });

  /* ---------- Active nav link (scroll spy) ---------- */
  const navAnchors = $$(".nav-links a");
  const sections = $$("main section[id]");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navAnchors.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- Scroll progress + back to top ---------- */
  const progress = $("#scroll-progress");
  const toTop = $("#back-to-top");
  let ticking = false;
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
    toTop.classList.toggle("show", window.scrollY > 500);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  // small stagger for items that share a grid
  $$(".projects-container, .services-container, .skill-grid, .info-cards").forEach((grid) => {
    $$(".reveal, .info-card", grid).forEach((el, i) => (el.style.transitionDelay = i * 90 + "ms"));
  });
  $$(".reveal").forEach((el) => revealObs.observe(el));

  /* ---------- Counters ---------- */
  const counters = $$("[data-count]");
  const countObs = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.dataset.count;
        if (reduceMotion) { el.textContent = target; obs.unobserve(el); return; }
        const duration = 1400;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((c) => countObs.observe(c));

  /* ---------- Typing effect ---------- */
  const typingEl = $("#typing");
  const words = ["Data Analyst", "AI Engineer", "React Developer", "Web Enthusiast", "UI/UX Designer", "Full Stack Developer"];
  if (reduceMotion) {
    typingEl.textContent = words[0];
  } else {
    let w = 0, c = 0, deleting = false;
    const type = () => {
      const word = words[w];
      typingEl.textContent = word.substring(0, c);
      let delay = deleting ? 45 : 95;
      if (!deleting && c === word.length) { deleting = true; delay = 1400; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 400; }
      c += deleting ? -1 : 1;
      setTimeout(type, delay);
    };
    type();
  }

  /* ---------- Project filter ---------- */
  const filterBtns = $$(".filter");
  const cards = $$(".project-card");
  filterBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      cards.forEach((card) => {
        card.classList.toggle("hide", f !== "all" && card.dataset.cat !== f);
      });
    })
  );

  /* ---------- Subtle 3D tilt on project cards (desktop only) ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-8px) perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    });
  }

  /* ---------- Contact form (no page reload) ---------- */
  const form = $("#contact-form");
  const status = $("#form-status");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("button[type=submit]", form);
    const label = $("span", btn);
    const original = label.textContent;
    btn.disabled = true;
    label.textContent = "Sending...";
    status.className = "";
    status.textContent = "";
    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Request failed");
      status.className = "ok";
      status.textContent = "Thanks! Your message has been sent. I'll reply soon.";
      form.reset();
    } catch (err) {
      status.className = "err";
      status.textContent = "Something went wrong. Please email me directly at akhileshsinghp1008@gmail.com";
    } finally {
      btn.disabled = false;
      label.textContent = original;
    }
  });

  /* ---------- Footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
