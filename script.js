const setBodyReady = () => {
  requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
  });
};

const loader = document.querySelector("[data-loader]");
if (loader) {
  let skipLoader = false;
  try {
    if (sessionStorage.getItem("yamabuki-loader-shown") === "1") {
      skipLoader = true;
    }
  } catch (e) {
    /* ignore */
  }
  if (!skipLoader && document.referrer) {
    try {
      const refUrl = new URL(document.referrer);
      if (refUrl.origin === window.location.origin) {
        skipLoader = true;
      }
    } catch (e) {
      /* ignore */
    }
  }

  if (skipLoader) {
    try {
      sessionStorage.setItem("yamabuki-loader-shown", "1");
    } catch (e) {
      /* ignore */
    }
    loader.parentNode && loader.parentNode.removeChild(loader);
    setBodyReady();
  } else {
    document.body.classList.add("is-loading");
    try {
      sessionStorage.setItem("yamabuki-loader-shown", "1");
    } catch (e) {
      /* ignore */
    }
    const minDisplayMs = 3700;
    const start = performance.now();
    const morphLogoToHeader = () => {
      const bigLogo = loader.querySelector(".loader__logo");
      const headerLogo = document.querySelector(".brand img");
      if (!bigLogo || !headerLogo) return;
      const bigRect = bigLogo.getBoundingClientRect();
      const headerRect = headerLogo.getBoundingClientRect();
      if (bigRect.width === 0 || headerRect.width === 0) return;
      const bigCx = bigRect.left + bigRect.width / 2;
      const bigCy = bigRect.top + bigRect.height / 2;
      const headerCx = headerRect.left + headerRect.width / 2;
      const headerCy = headerRect.top + headerRect.height / 2;
      const dx = headerCx - bigCx;
      const dy = headerCy - bigCy;
      const scale = headerRect.width / bigRect.width;
      bigLogo.style.setProperty("--logo-dx", `${dx}px`);
      bigLogo.style.setProperty("--logo-dy", `${dy}px`);
      bigLogo.style.setProperty("--logo-scale", String(scale));
      loader.classList.add("is-morphing");
    };
    const hideLoader = () => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, minDisplayMs - elapsed);
      setTimeout(() => {
        morphLogoToHeader();
        loader.classList.add("is-hidden");
        document.body.classList.remove("is-loading");
        setBodyReady();
      }, remaining);
    };
    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader, { once: true });
    }
  }
} else {
  setBodyReady();
}

let scrollRafPending = false;
const updateScrollVar = () => {
  if (scrollRafPending) return;
  scrollRafPending = true;
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty("--scroll-y", `${window.scrollY}px`);
    scrollRafPending = false;
  });
};
window.addEventListener("scroll", updateScrollVar, { passive: true });
updateScrollVar();

const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navPanel = document.querySelector("[data-nav]");
const forms = document.querySelectorAll("[data-form]");
const yearTargets = document.querySelectorAll("[data-year]");
const fadeTargets = document.querySelectorAll(".fade-in");

yearTargets.forEach((target) => {
  target.textContent = new Date().getFullYear();
});

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 100);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

if (menuToggle && navPanel) {
  const closeMenu = () => {
    navPanel.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "メニューを開く");
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = navPanel.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
  });

  navPanel.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

const encodeFormData = (formData) =>
  new URLSearchParams(Array.from(formData.entries())).toString();

forms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formMessage = form.querySelector(".form-message");
    const successMessage = form.dataset.success || "送信ありがとうございました。内容を確認のうえ、ご連絡いたします。";

    if (formMessage) {
      formMessage.textContent = "送信しています...";
    }

    if (window.location.protocol === "file:") {
      if (formMessage) formMessage.textContent = successMessage;
      form.reset();
      return;
    }

    try {
      const formData = new FormData(form);
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encodeFormData(formData),
      });
      if (formMessage) formMessage.textContent = successMessage;
      form.reset();
    } catch (error) {
      if (formMessage) {
        formMessage.textContent = "送信に失敗しました。時間をおいて再度お試しください。";
      }
    }
  });
});

const autoFadeSelectors = [
  ".section__head",
  ".news-item",
  ".overview-card",
  ".flow-card",
  ".info-card",
  ".service-card",
  ".form-card",
  ".access-map",
  ".tel-box",
  ".quick-lead article",
  ".cta-band"
];
autoFadeSelectors.forEach((selector) => {
  document.querySelectorAll(selector).forEach((el) => {
    if (el.closest(".hero")) return;
    if (el.closest("[data-loader]")) return;
    if (el.closest(".site-header")) return;
    if (el.closest(".site-footer")) return;
    el.classList.add("fade-in");
  });
});

const allFadeTargets = document.querySelectorAll(".fade-in");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const siblings = Array.from(target.parentElement?.children || []).filter((el) =>
            el.classList.contains("fade-in")
          );
          const index = siblings.indexOf(target);
          target.style.transitionDelay = `${Math.max(0, index) * 0.16}s`;
          target.classList.add("is-visible");
          observer.unobserve(target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  allFadeTargets.forEach((target) => observer.observe(target));
} else {
  allFadeTargets.forEach((target) => target.classList.add("is-visible"));
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;


const cards = document.querySelectorAll(".reason-card, .link-card, .member-banner");
cards.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--mx", `${mx}%`);
    card.style.setProperty("--my", `${my}%`);
  });
  card.addEventListener("mouseleave", () => {
    card.style.setProperty("--mx", `50%`);
    card.style.setProperty("--my", `50%`);
  });
});

const smoothScrollTo = (targetY, duration = 1100) => {
  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const step = (now) => {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    window.scrollTo(0, startY + distance * easeOutExpo(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

document.querySelectorAll('a[href*="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href") || "";
    const hashIndex = href.indexOf("#");
    if (hashIndex === -1) return;
    const hash = href.slice(hashIndex);
    if (hash.length < 2) return;
    const samePagePrefix = href.slice(0, hashIndex);
    const here = window.location.pathname.split("/").pop() || "index.html";
    if (samePagePrefix && samePagePrefix !== here && samePagePrefix !== "" && samePagePrefix !== "/") return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    const headerEl = document.querySelector("[data-header]");
    const headerHeight = headerEl ? headerEl.offsetHeight : 80;
    const targetY = target.getBoundingClientRect().top + window.scrollY - headerHeight - 24;
    if (prefersReducedMotion) {
      window.scrollTo(0, targetY);
    } else {
      smoothScrollTo(Math.max(0, targetY), 1100);
    }
    if (history.pushState) {
      history.pushState(null, "", hash);
    }
  });
});
