(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav: scrolled state, hide on scroll down ---------- */
  const nav = $("#nav");
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle("is-scrolled", y > 24);
    const menuOpen = document.body.classList.contains("menu-open");
    nav.classList.toggle("is-hidden", !menuOpen && y > 600 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove("is-hidden");
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Active section link ---------- */
  const links = $$(".nav__links a");
  const sectionObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${e.target.id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("section[id]").forEach((s) => sectionObs.observe(s));

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const menu = $("#menu");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* ---------- Reveal on view ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        revealObs.unobserve(e.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
  );
  $$(".reveal, .hero__title, .sec-head__title, .contact__title").forEach((el, i) => {
    // stagger siblings inside grids
    const parent = el.parentElement;
    const idx = [...parent.children].filter((c) => c.classList.contains("reveal")).indexOf(el);
    if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 6) * 70}ms`;
    revealObs.observe(el);
  });

  /* ---------- Counters ---------- */
  const countObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        $$("[data-count]", e.target).forEach((b) => {
          const to = Number(b.dataset.count);
          if (reduced) { b.textContent = to; return; }
          const t0 = performance.now();
          const dur = 1600;
          const tick = (now) => {
            const p = Math.min(1, (now - t0) / dur);
            b.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        countObs.unobserve(e.target);
      });
    },
    { threshold: 0.4 }
  );
  $$(".stat").forEach((s) => countObs.observe(s));

  /* ---------- Card spotlight ---------- */
  $$(".card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Hong Kong clock ---------- */
  const clock = $("#clock");
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit" });
  const tickClock = () => (clock.textContent = fmt.format(new Date()));
  tickClock();
  setInterval(tickClock, 15000);

  /* ---------- Copy email ---------- */
  const copy = $("#copy");
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copy.dataset.copy);
      copy.textContent = "Copied ✓";
    } catch {
      copy.textContent = copy.dataset.copy;
    }
    copy.classList.add("is-done");
    setTimeout(() => { copy.textContent = "Copy email"; copy.classList.remove("is-done"); }, 1800);
  });

  /* ---------- Hero video: pause off-screen, respect reduced motion ---------- */
  const video = $(".hero__video");
  if (video) {
    if (reduced) video.removeAttribute("autoplay"), video.pause();
    // The generated loop is exactly 10s; the encoder holds the last frame a bit longer,
    // so wrap early to keep the loop seamless.
    const LOOP = 10;
    const wrap = () => {
      if (video.currentTime >= LOOP - 0.04) video.currentTime = 0;
      if (!video.paused) requestAnimationFrame(wrap);
    };
    video.addEventListener("play", () => requestAnimationFrame(wrap));
    new IntersectionObserver(([e]) => {
      if (reduced) return;
      e.isIntersecting ? video.play().catch(() => {}) : video.pause();
    }).observe(video);
  }

  /* ---------- Cursor dot ---------- */
  const cursor = $("#cursor");
  if (matchMedia("(hover: hover) and (pointer: fine)").matches && !reduced) {
    let x = 0, y = 0, cx = 0, cy = 0;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; cursor.classList.add("is-on"); });
    document.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    $$("a, button, .card").forEach((el) => {
      el.addEventListener("pointerenter", () => cursor.classList.add("is-big"));
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-big"));
    });
  }
})();
