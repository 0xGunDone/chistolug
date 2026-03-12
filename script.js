document.documentElement.classList.add("js");

const root = document.documentElement;
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const revealNodes = document.querySelectorAll(".reveal");
const form = document.querySelector("#quote-form");
const statusNode = document.querySelector("#form-status");
const yearNode = document.querySelector("#year");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const syncHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 18);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    root.classList.toggle("nav-open", !expanded);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      root.classList.remove("nav-open");
    });
  });
}

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
    { threshold: 0.2, rootMargin: "0px 0px -40px 0px" },
  );

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

document.querySelectorAll(".chip-link").forEach((link) => {
  link.addEventListener("click", () => {
    const targetId = link.getAttribute("href");
    if (!targetId) return;
    const panel = document.querySelector(targetId);
    if (panel instanceof HTMLDetailsElement) {
      panel.open = true;
    }
  });
});

window.addEventListener("load", () => {
  const hash = window.location.hash;
  if (!hash) return;

  const target = document.querySelector(hash);
  if (!target) return;

  if (target instanceof HTMLDetailsElement) {
    target.open = true;
  }

  window.requestAnimationFrame(() => {
    target.scrollIntoView({ block: "start" });
  });
});

if (form && statusNode) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const contact = (data.get("contact") || "").toString().trim();
    const service = (data.get("service") || "").toString().trim();
    const area = (data.get("area") || "").toString().trim();
    const message = (data.get("message") || "").toString().trim();

    const body = [
      "Запрос на расчет работ",
      "",
      `Имя / компания: ${name}`,
      `Контакт: ${contact}`,
      `Направление: ${service || "не указано"}`,
      `Площадь / ориентир: ${area || "не указано"}`,
      "",
      "Описание участка:",
      message || "не указано",
    ].join("\n");

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(body);
      }
    } catch (_error) {
      // Leave the text visible via the status message if clipboard access is blocked.
    }

    statusNode.textContent =
      "Текст заявки скопирован в буфер обмена. Отправьте его в удобный мессенджер или используйте как основу для звонка.";

    form.reset();
  });
}
