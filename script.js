document.documentElement.classList.add("js");

const root = document.documentElement;
const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const revealNodes = document.querySelectorAll(".reveal");
const form = document.querySelector("#quote-form");
const statusNode = document.querySelector("#form-status");
const formActions = document.querySelector("#form-actions");
const yearNode = document.querySelector("#year");
const phoneDigits = "79954348800";

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const closeNav = () => {
  if (!navToggle) return;
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Открыть меню");
  root.classList.remove("nav-open");
};

const syncHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 18);
};

const syncHeaderOffset = () => {
  const defaultOffset = 120;
  const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : defaultOffset;
  root.style.setProperty("--header-offset", `${headerHeight + 14}px`);
};

const openHashTarget = (hash, behavior = "smooth") => {
  if (!hash) return;
  if (hash === "#top") {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  const target = document.querySelector(hash);
  if (!target) return;

  if (target instanceof HTMLDetailsElement) {
    target.open = true;
  }

  const offset = header ? header.getBoundingClientRect().height + 14 : 120;
  const y = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, y), behavior });
};

syncHeader();
syncHeaderOffset();
window.addEventListener("scroll", syncHeader, { passive: true });
window.addEventListener("resize", () => {
  syncHeaderOffset();
  if (window.innerWidth > 880) {
    closeNav();
  }
});

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navToggle.setAttribute("aria-label", expanded ? "Открыть меню" : "Закрыть меню");
    root.classList.toggle("nav-open", !expanded);
  });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const hash = anchor.getAttribute("href");
    if (!hash) return;
    event.preventDefault();
    closeNav();
    openHashTarget(hash, "smooth");
    history.replaceState(null, "", hash);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
  }
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
  syncHeaderOffset();
  if (window.location.hash) {
    window.requestAnimationFrame(() => {
      openHashTarget(window.location.hash, "auto");
    });
  }
});

const syncPriceTableLabels = () => {
  document.querySelectorAll(".price-table").forEach((table) => {
    const headers = Array.from(table.querySelectorAll("thead th")).map((th) =>
      (th.textContent || "").trim(),
    );
    table.querySelectorAll("tbody tr").forEach((row) => {
      row.querySelectorAll("td").forEach((cell, index) => {
        const headerLabel = headers[index] || "Параметр";
        cell.setAttribute("data-label", headerLabel);
      });
    });
  });
};

syncPriceTableLabels();

const buildLeadText = (payload) =>
  [
    "Запрос на расчет работ",
    "",
    `Имя / компания: ${payload.name}`,
    `Контакт: ${payload.contact}`,
    `Направление: ${payload.service || "не указано"}`,
    `Площадь / ориентир: ${payload.area || "не указано"}`,
    "",
    "Описание участка:",
    payload.message || "не указано",
  ].join("\n");

const createActionLink = (label, href) => {
  const link = document.createElement("a");
  link.className = "form-action-link";
  link.href = href;
  link.textContent = label;
  if (href.startsWith("http")) {
    link.target = "_blank";
    link.rel = "noopener";
  }
  return link;
};

if (form && statusNode) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const payload = {
      name: (data.get("name") || "").toString().trim(),
      contact: (data.get("contact") || "").toString().trim(),
      service: (data.get("service") || "").toString().trim(),
      area: (data.get("area") || "").toString().trim(),
      message: (data.get("message") || "").toString().trim(),
    };
    const body = buildLeadText(payload);
    const encodedBody = encodeURIComponent(body);
    const endpoint =
      (form.getAttribute("data-endpoint") || "").trim() ||
      (window.CHISTOLUG_LEAD_ENDPOINT || "").toString().trim();

    let clipboardSaved = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(body);
        clipboardSaved = true;
      }
    } catch (_error) {
      clipboardSaved = false;
    }

    let endpointSaved = false;
    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            raw: body,
            page: window.location.href,
            createdAt: new Date().toISOString(),
          }),
        });
        endpointSaved = response.ok;
      } catch (_error) {
        endpointSaved = false;
      }
    }

    if (endpointSaved) {
      statusNode.textContent =
        "Заявка отправлена. На всякий случай текст также доступен для отправки в WhatsApp/Telegram ниже.";
    } else if (clipboardSaved) {
      statusNode.textContent =
        "Текст заявки скопирован в буфер. Выберите удобный канал ниже, чтобы отправить его сразу.";
    } else {
      statusNode.textContent =
        "Выберите удобный канал ниже и отправьте заявку одним кликом. Если нужно, продиктуйте её по телефону.";
    }

    if (formActions) {
      formActions.hidden = false;
      formActions.replaceChildren(
        createActionLink("Позвонить", `tel:+${phoneDigits}`),
        createActionLink("WhatsApp", `https://wa.me/${phoneDigits}?text=${encodedBody}`),
        createActionLink(
          "Telegram",
          `https://t.me/share/url?url=${encodeURIComponent(window.location.origin + window.location.pathname)}&text=${encodedBody}`,
        ),
        createActionLink("SMS", `sms:+${phoneDigits}?body=${encodedBody}`),
      );
    }

    form.reset();
  });
}
