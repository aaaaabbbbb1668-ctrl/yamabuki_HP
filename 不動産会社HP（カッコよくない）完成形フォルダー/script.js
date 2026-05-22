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

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  fadeTargets.forEach((target) => observer.observe(target));
} else {
  fadeTargets.forEach((target) => target.classList.add("is-visible"));
}
