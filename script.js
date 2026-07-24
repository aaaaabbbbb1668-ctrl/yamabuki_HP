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
    // 演出は固定タイムライン（CSSアニメーションと同期）：
    // 0.15s 一文字ずつ入場 → 0.9s 金線・英字 → 2.2s 文章退場 → 2.5s ロゴ → 3.3s カーテン → 4.4s 全体フェード
    setTimeout(() => {
      loader.classList.add("is-hidden");
      document.body.classList.remove("is-loading");
      setBodyReady();
    }, 4400);
    setTimeout(() => {
      loader.classList.add("is-done");
      loader.parentNode && loader.parentNode.removeChild(loader);
    }, 5200);
  }
} else {
  setBodyReady();
}

const heroCatch = document.querySelector(".hero__catch");
if (heroCatch && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const catchText = heroCatch.textContent.trim();
  heroCatch.setAttribute("aria-label", catchText);
  heroCatch.textContent = "";
  heroCatch.classList.add("hero__catch--chars");
  const segments = catchText.split("、").filter(Boolean).map((seg, i, arr) => (i < arr.length - 1 ? seg + "、" : seg));
  let charIndex = 0;
  segments.forEach((segment) => {
    const line = document.createElement("span");
    line.className = "hero__catch-line";
    line.setAttribute("aria-hidden", "true");
    Array.from(segment).forEach((ch) => {
      const s = document.createElement("span");
      s.textContent = ch;
      if (ch === "\u3001" || ch === "\u3002") s.classList.add("is-punct");
      s.style.transitionDelay = `${0.35 + charIndex * 0.04}s`;
      charIndex += 1;
      line.appendChild(s);
    });
    heroCatch.appendChild(line);
  });
}

const reasonScrollItems = document.querySelectorAll(".reason-scroll__items .reason-item[data-reason]");
const reasonLayers = document.querySelectorAll(".reason-visual__layer");
if (reasonScrollItems.length && reasonLayers.length && "IntersectionObserver" in window) {
  const reasonObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = entry.target.dataset.reason;
        reasonLayers.forEach((layer) => {
          layer.classList.toggle("is-active", layer.dataset.reason === idx);
        });
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );
  reasonScrollItems.forEach((item) => reasonObserver.observe(item));
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
