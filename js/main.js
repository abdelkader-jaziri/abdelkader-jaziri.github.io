(function () {
  "use strict";

  const SITE = window.SITE;
  const I18N = window.I18N;
  const root = document.documentElement;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ } }
  };

  const LANGS = ["it", "en", "fr", "ar"];
  const LOCALES = { en: "en-GB", fr: "fr-FR", it: "it-IT", ar: "ar-TN" };
  let lang = store.get("aj-lang");
  if (!LANGS.includes(lang)) lang = "it";

  const t = (key) => (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? "" : vars[k]));
  const fmt = (n, digits = 0) => new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: digits }).format(n);
  const waLink = (text) => `https://wa.me/${SITE.contact.whatsapp}?text=${encodeURIComponent(text)}`;

  const ICONS = {
    electrical: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    solar: '<svg viewBox="0 0 24 24"><path d="M3 20h18M5 16l2-8h10l2 8zM9 8l-1 8M15 8l1 8M6 12h12M12 2v2M5.6 4.6l1 1M18.4 4.6l-1 1"/></svg>',
    network: '<svg viewBox="0 0 24 24"><path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/></svg>',
    security: '<svg viewBox="0 0 24 24"><path d="M3 7l13-3 2 6-13 3zM16.5 8.5 21 9.5v4l-4-1M7 13l1 4H4M4 14v6"/></svg>',
    satellite: '<svg viewBox="0 0 24 24"><path d="M4 10a8 8 0 0 0 10 10zM9 15l4-4M13 11l1.5-1.5M15 4a5 5 0 0 1 5 5M15 7.5a1.5 1.5 0 0 1 1.5 1.5M7 20h6"/></svg>',
    facebook: '<svg viewBox="0 0 24 24"><path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>'
  };

  /* ───────── Contact details from content.js ───────── */
  function bindContact() {
    const c = SITE.contact;
    $$('[data-contact="phone"]').forEach((a) => { a.href = `tel:${c.phone.replace(/\s+/g, "")}`; });
    $$('[data-contact="email"]').forEach((a) => { a.href = `mailto:${c.email}`; });
    $$("[data-contact-text]").forEach((el) => { el.textContent = c[el.dataset.contactText] || ""; });
    $("#map").src = `https://maps.google.com/maps?q=${encodeURIComponent(c.mapQuery)}&z=11&output=embed`;

    const socials = $("#socials");
    ["facebook", "instagram", "linkedin"].forEach((name) => {
      if (!c[name]) return;
      const a = document.createElement("a");
      a.href = c[name];
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", name);
      a.innerHTML = ICONS[name];
      socials.append(a);
    });

    const schema = {
      "@context": "https://schema.org",
      "@type": "Electrician",
      name: "Abdelkader Jaziri",
      description: I18N.en["meta.description"],
      telephone: c.phone,
      email: c.email,
      address: { "@type": "PostalAddress", addressLocality: "Monastir", addressCountry: "TN" },
      areaServed: c.location,
      knowsAbout: ["Electrical installation", "Photovoltaic systems", "Satellite TV installation", "Networking", "CCTV"],
      sameAs: [c.facebook, c.instagram, c.linkedin].filter(Boolean)
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.append(script);
  }

  /* ───────── Language ───────── */
  function applyLanguage(next) {
    lang = next;
    store.set("aj-lang", lang);
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";

    $$("[data-i18n]").forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    $$(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    $$("[data-wa]").forEach((a) => { a.href = waLink(t("wa.hello")); });

    document.title = t("meta.title");
    $('meta[name="description"]').setAttribute("content", t("meta.description"));

    renderGallery();
    updateEstimator();
    updateTimeline();
  }

  /* ───────── Theme ───────── */
  function initTheme() {
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    const meta = $('meta[name="theme-color"]');
    const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : dark.matches);
    const syncMeta = () => meta.setAttribute("content", isDark() ? "#0a0d14" : "#f6f5f1");

    $("#theme-toggle").addEventListener("click", () => {
      root.dataset.theme = isDark() ? "light" : "dark";
      store.set("aj-theme", root.dataset.theme);
      syncMeta();
    });
    dark.addEventListener("change", syncMeta);
    syncMeta();
  }

  /* ───────── Navigation ───────── */
  function initNav() {
    const nav = $(".nav");
    const menu = $("#nav-links");
    const menuBtn = $("#menu-btn");
    const waFloat = $(".wa-float");

    const closeMenu = () => { menu.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); };
    menuBtn.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

    const onScroll = () => {
      nav.classList.toggle("scrolled", window.scrollY > 10);
      waFloat.classList.toggle("show", window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (!("IntersectionObserver" in window)) return;
    const links = new Map($$("a", menu).map((a) => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.remove("active"));
        const link = links.get(entry.target.id);
        if (link) link.classList.add("active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => spy.observe(s));
  }

  /* ───────── Reveal + counters ───────── */
  function animateCount(el) {
    const since = el.dataset.countSince;
    const target = since ? new Date().getFullYear() - Number(since) : Number(el.dataset.count);
    if (reducedMotion) { el.textContent = fmt(target); return; }
    const start = performance.now();
    const duration = 1400;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function initReveal() {
    const counters = $$("[data-count], [data-count-since]");
    if (!("IntersectionObserver" in window)) {
      $$(".reveal").forEach((el) => el.classList.add("in"));
      counters.forEach(animateCount);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        $$("[data-count], [data-count-since]", entry.target).forEach(animateCount);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 80}ms`;
      io.observe(el);
    });
  }

  /* ───────── Timeline "current" ───────── */
  const timeline = $(".timeline");
  const progress = $(".timeline-progress");
  function updateTimeline() {
    const rect = timeline.getBoundingClientRect();
    const trigger = window.innerHeight * 0.62;
    const p = Math.min(1, Math.max(0, (trigger - rect.top) / rect.height));
    progress.style.transform = `scaleY(${p})`;
    $$("li", timeline).forEach((li) => li.classList.toggle("lit", li.getBoundingClientRect().top < trigger));
  }
  function initTimeline() {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { updateTimeline(); ticking = false; });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }

  /* ───────── Solar estimator ───────── */
  const YIELD_KWH_PER_KWP = 1550;
  const PANEL_WATTS = 450;
  const PANEL_AREA_M2 = 2.2;
  const GRID_KG_CO2_PER_KWH = 0.45;
  const range = $("#kwh");
  let lastEstimate = null;

  function updateEstimator() {
    const kwh = Number(range.value);
    const panels = Math.max(2, Math.ceil((kwh * 12 * 1000) / (YIELD_KWH_PER_KWP * PANEL_WATTS)));
    const kwp = (panels * PANEL_WATTS) / 1000;
    const production = kwp * YIELD_KWH_PER_KWP;
    lastEstimate = { kwh, kwp: fmt(kwp, 2), panels };

    const pct = ((kwh - range.min) / (range.max - range.min)) * 100;
    range.style.setProperty("--fill", `${pct}%`);
    $("#kwh-out b").textContent = fmt(kwh);
    $("#r-kwp").textContent = fmt(kwp, 2);
    $("#r-panels").textContent = fmt(panels);
    $("#r-area").textContent = fmt(Math.ceil(panels * PANEL_AREA_M2));
    $("#r-prod").textContent = fmt(Math.round(production / 10) * 10);
    $("#r-co2").textContent = fmt((production * GRID_KG_CO2_PER_KWH) / 1000, 1);
    $("#est-cta").href = waLink(fill(t("est.msg"), lastEstimate));
  }
  function initEstimator() {
    range.addEventListener("input", updateEstimator);
  }

  /* ───────── Gallery + lightbox ───────── */
  const PAGE_SIZE = 8;
  let activeFilter = "all";
  let showAll = false;
  const lightbox = $("#lightbox");
  let lightboxItems = [];
  let lightboxIndex = 0;

  function projectTitle(p) {
    return (p.title && (p.title[lang] || p.title.en)) || t(`f.${p.category}`);
  }

  function renderGallery() {
    const grid = $("#gallery");
    grid.innerHTML = "";
    const visible = SITE.projects.filter((p) => activeFilter === "all" || p.category === activeFilter);
    const hidden = showAll ? 0 : Math.max(0, visible.length - PAGE_SIZE);
    const more = $("#gallery-more");
    more.hidden = hidden === 0;
    more.textContent = fill(t("work.more"), { n: hidden });

    visible
      .slice(0, showAll ? visible.length : PAGE_SIZE)
      .forEach((p) => {
        const title = projectTitle(p);
        const fig = document.createElement("figure");
        fig.className = "tile";
        fig.dataset.cat = p.category;
        fig.innerHTML = `
          <div class="tile-media"><div class="tile-ph">${ICONS[p.category] || ICONS.electrical}<span></span></div></div>
          <figcaption><span class="tag"></span><strong></strong></figcaption>`;
        $(".tile-ph span", fig).textContent = t("work.soon");
        $(".tag", fig).textContent = t(`f.${p.category}`);
        $("strong", fig).textContent = title;
        grid.append(fig);

        if (!p.src) return;
        fig.classList.add("has-src");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", title);
        const img = document.createElement("img");
        img.alt = title;
        img.decoding = "async";
        img.loading = "lazy";
        img.addEventListener("error", () => {
          btn.remove();
          fig.classList.remove("has-src");
        });
        btn.append(img);
        btn.addEventListener("click", () => openLightbox(img));
        $(".tile-media", fig).append(btn);
        img.src = p.src;
      });
  }

  function openLightbox(img) {
    lightboxItems = $$("#gallery .tile-media img");
    lightboxIndex = Math.max(0, lightboxItems.indexOf(img));
    showLightbox();
    if (typeof lightbox.showModal === "function") lightbox.showModal();
    else window.open(img.src, "_blank", "noopener");
  }
  function showLightbox() {
    const img = lightboxItems[lightboxIndex];
    if (!img) return;
    $("#lb-img").src = img.src;
    $("#lb-img").alt = img.alt;
    $("#lb-cap").textContent = img.alt;
    const multiple = lightboxItems.length > 1;
    $(".lb-prev", lightbox).hidden = !multiple;
    $(".lb-next", lightbox).hidden = !multiple;
  }
  function stepLightbox(delta) {
    lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    showLightbox();
  }

  function initGallery() {
    const categories = new Set(SITE.projects.map((p) => p.category));
    $$(".filters button").forEach((btn) => {
      if (btn.dataset.filter !== "all") btn.hidden = !categories.has(btn.dataset.filter);
    });
    $(".filters").hidden = categories.size < 2;
    $("#gallery-more").addEventListener("click", () => {
      showAll = true;
      renderGallery();
    });

    $$(".filters button").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter;
        showAll = false;
        $$(".filters button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        renderGallery();
      });
    });
    const rtl = () => root.dir === "rtl";
    $(".lb-close", lightbox).addEventListener("click", () => lightbox.close());
    $(".lb-prev", lightbox).addEventListener("click", () => stepLightbox(-1));
    $(".lb-next", lightbox).addEventListener("click", () => stepLightbox(1));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });
    lightbox.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") stepLightbox(rtl() ? -1 : 1);
      if (e.key === "ArrowLeft") stepLightbox(rtl() ? 1 : -1);
    });
  }

  /* ───────── Contact form ───────── */
  function initForm() {
    const form = $("#contact-form");
    const buildMessage = () => {
      const data = new FormData(form);
      const name = (data.get("name") || "").trim();
      const phone = (data.get("phone") || "").trim();
      return fill(t("form.msg"), {
        name: phone ? `${name} (${phone})` : name,
        service: t(data.get("service")),
        message: (data.get("message") || "").trim()
      });
    };
    const validate = () => {
      let ok = true;
      $$("[required]", form).forEach((field) => {
        const bad = !field.value.trim();
        field.classList.toggle("invalid", bad);
        if (bad && ok) { field.focus(); ok = false; }
      });
      return ok;
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;
      window.open(waLink(buildMessage()), "_blank", "noopener");
    });
    $("#send-email").addEventListener("click", () => {
      if (!validate()) return;
      window.location.href = `mailto:${SITE.contact.email}?subject=${encodeURIComponent(t("form.subject"))}&body=${encodeURIComponent(buildMessage())}`;
    });
    $$("[required]", form).forEach((f) => f.addEventListener("input", () => f.classList.remove("invalid")));
  }

  /* ───────── Boot ───────── */
  $$(".lang-switch button").forEach((b) => b.addEventListener("click", () => applyLanguage(b.dataset.lang)));
  $$("[data-print]").forEach((b) => b.addEventListener("click", () => window.print()));
  $("#year").textContent = new Date().getFullYear();

  bindContact();
  initTheme();
  initNav();
  initGallery();
  initEstimator();
  initForm();
  initTimeline();
  applyLanguage(lang);
  initReveal();
})();
