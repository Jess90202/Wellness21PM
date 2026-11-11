// Marca que el JS está activo: las animaciones de entrada solo aplican con JS.
document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", () => {
  // Año en el footer
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Menú móvil
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (navToggle && nav) {
    const setMenuOpen = (isOpen) => {
      nav.classList.toggle("show", isOpen);
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    };

    navToggle.addEventListener("click", () => {
      setMenuOpen(!nav.classList.contains("show"));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });
  }

  // Scroll suave para enlaces internos
  const internalLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  internalLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Header sticky (versión web)
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => {
      if (window.scrollY > 10) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
  }

  // Horario real (hora de CDMX): mañanas 8–13 h, noches 20–23 h.
  const SHIFTS = [
    { open: 8, close: 13, label: "13:00" },
    { open: 20, close: 23, label: "23:00" }
  ];

  const getCdmxTime = () => {
    const parts = new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23"
    }).formatToParts(new Date());
    const value = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
    return value("hour") + value("minute") / 60;
  };

  const getOpenState = (now) => {
    const current = SHIFTS.find((s) => now >= s.open && now < s.close);
    if (current) {
      return { isOpen: true, text: `Abierto ahora · hasta las ${current.label} h` };
    }
    const next = SHIFTS.find((s) => now < s.open);
    if (next) {
      return { isOpen: false, text: `Cerrado ahora · abre hoy a las ${next.open}:00 h` };
    }
    return { isOpen: false, text: "Cerrado ahora · abre mañana a las 8:00 h" };
  };

  const updateOpenStatus = () => {
    const state = getOpenState(getCdmxTime());
    document.querySelectorAll("[data-open-status]").forEach((el) => {
      el.classList.toggle("is-open", state.isOpen);
      const textEl = el.querySelector("[data-open-text]");
      if (textEl) textEl.textContent = state.text;
    });
    return state;
  };

  try {
    updateOpenStatus();
    setInterval(updateOpenStatus, 60000);
  } catch (error) {
    // Si el navegador no soporta zonas horarias, se queda el horario fijo del HTML.
  }

  // Texto dinámico en barra fija de WhatsApp (móvil), según el horario de atención
  const mobileCtaText = document.querySelector(".mobile-cta-text");
  if (mobileCtaText) {
    let hour = new Date().getHours();
    try {
      hour = getCdmxTime();
    } catch (error) {
      // se usa la hora local
    }
    if (hour >= 8 && hour < 13) {
      mobileCtaText.textContent = "¿Te agendo una sesión hoy?";
    } else if (hour >= 13 && hour < 20) {
      mobileCtaText.textContent = "¿Agendamos para esta noche?";
    } else if (hour >= 20 && hour < 23) {
      mobileCtaText.textContent = "¿Hay espacio hoy en la noche? Pregunta";
    } else {
      mobileCtaText.textContent = "¿Agendamos tu sesión para mañana?";
    }
  }

  // Animaciones de aparición (scroll reveal)
  const revealEls = document.querySelectorAll("[data-reveal]");
  revealEls.forEach((section) => {
    section.querySelectorAll(".reveal").forEach((el, index) => {
      el.style.setProperty("--i", String(Math.min(index, 8)));
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
      { threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );

    revealEls.forEach((el) => observer.observe(el));
  } else {
    // Degradado: mostrar todo si no hay soporte
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const chatRoot   = document.querySelector(".w21-chat");
  if (!chatRoot) return;

  const toggleBtn  = chatRoot.querySelector(".w21-chat-toggle");
  const windowEl   = chatRoot.querySelector(".w21-chat-window");
  const closeBtn   = chatRoot.querySelector(".w21-chat-close");
  const backdropEl = chatRoot.querySelector(".w21-chat-backdrop");
  const messagesEl = chatRoot.querySelector("#w21ChatMessages");
  const formEl     = chatRoot.querySelector("#w21ChatForm");
  const inputEl    = chatRoot.querySelector("#w21ChatInput");

  // Cambia este número a tu WhatsApp (formato internacional sin +, ej. 52 + 10 dígitos)
  const WHATSAPP_PHONE = "525585662464";

  let userName = "";
  let step = "askName"; // askName → askSymptoms → ready
  let typingNode = null;

  // ----- Base de conocimiento de servicios que ofrece Wellness 21PM -----
  const SERVICES = [
    {
      id: "relajante",
      name: "Masaje relajante / descontracturante",
      tags: ["estres", "ansiedad", "cabeza", "cuello", "espalda", "general", "sueno"],
      description: "Ideal para estrés, tensión en cuello y espalda, sobrecarga general y dificultad para descansar."
    },
    {
      id: "deportivo",
      name: "Masaje atlético deportivo",
      tags: ["deporte", "piernas", "maraton", "gym", "fatiga", "contracturas"],
      description: "Pensado para recuperación después de entrenamientos fuertes, maratones y sobrecarga por ejercicio."
    },
    {
      id: "bambu_piedras",
      name: "Masaje con bambuterapia y piedras volcánicas",
      tags: ["estres", "espalda", "lumbar", "relajacion_profunda"],
      description: "Ayuda a relajar musculatura profunda y liberar tensión acumulada, sobre todo en espalda y zona lumbar."
    },
    {
      id: "pistola_impacto",
      name: "Masaje con pistola de impacto e infrarrojo",
      tags: ["dolor_fuerte", "contracturas", "espalda", "lumbar", "deporte"],
      description: "Útil en contracturas marcadas y zonas muy cargadas donde se requiere un trabajo más intenso."
    },
    {
      id: "acupuntura",
      name: "Acupuntura y electroacupuntura",
      tags: ["cabeza", "migraña", "cronico", "dolor_fuerte", "emocional"],
      description: "Complemento del masaje cuando hay tensión acumulada en cabeza y cuello o buscas una relajación más profunda."
    },
    {
      id: "presoterapia",
      name: "Presoterapia",
      tags: ["circulacion", "piernas", "pesadez", "retencion"],
      description: "Para aliviar la sensación de piernas pesadas y cansadas, sobre todo si pasas muchas horas de pie o sentado."
    }
  ];

  const PACKAGES = [
    {
      id: "esencial",
      name: "Paquete Esencial",
      tags: ["leve", "primera_vez", "relajacion"],
      description: "Para molestias leves, primera experiencia o cuando quieres iniciar tu cuidado en Wellness 21PM."
    },
    {
      id: "manual",
      name: "Masaje Manual de Cuerpo Completo",
      tags: ["estres", "general", "sueno", "ansiedad"],
      description: "Masaje manual de cuerpo completo cuando hay estrés generalizado y necesidad de desconexión global."
    },
    {
      id: "plus",
      name: "Paquete Plus",
      tags: ["circulacion", "piernas", "deporte", "lumbar", "tecnologia"],
      description: "Combina masaje profundo con tecnologías como presoterapia y pistola de impacto para zonas muy cargadas."
    },
    {
      id: "renacer",
      name: "Masaje Renacer",
      tags: ["cronico", "multiples_zonas", "dolor_fuerte"],
      description: "Pensado para tensión acumulada en varias zonas o cuando necesitas una sesión más completa."
    }
  ];

  // ----- Utilidades de UI -----
  // Escapa texto del usuario antes de ponerlo dentro de HTML del asistente.
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // El texto del usuario se inserta como texto plano (nunca como HTML) para evitar XSS.
  // Solo los mensajes del asistente, que son textos fijos de este archivo, usan HTML.
  function addMessage(sender, content) {
    const isUser = sender === "user";
    const wrapper = document.createElement("div");
    wrapper.classList.add("w21-chat-message");
    wrapper.classList.add(isUser ? "user" : "assistant");

    const bubble = document.createElement("div");
    bubble.classList.add("w21-chat-bubble");
    if (isUser) {
      bubble.textContent = content;
    } else {
      bubble.innerHTML = content;
    }

    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    if (typingNode) return;
    const wrapper = document.createElement("div");
    wrapper.classList.add("w21-chat-message", "assistant");
    const bubble = document.createElement("div");
    bubble.classList.add("w21-chat-bubble");
    bubble.innerHTML = `
      <div class="w21-chat-typing">
        <span></span><span></span><span></span>
      </div>
    `;
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    typingNode = wrapper;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    if (typingNode) {
      typingNode.remove();
      typingNode = null;
    }
  }

  function normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // ----- Mapeo de texto → tags (tipo “IA simple”) -----
  function extractTags(raw) {
    const t = normalize(raw);
    const tags = new Set();

    // Zonas
    if (t.includes("cabeza") || t.includes("migra")) tags.add("cabeza");
    if (t.includes("cuello") || t.includes("nuca") || t.includes("trapecio")) {
      tags.add("cuello");
      tags.add("espalda");
    }
    if (t.includes("espalda baja") || t.includes("lumbar")) {
      tags.add("lumbar");
      tags.add("espalda");
    } else if (t.includes("espalda")) {
      tags.add("espalda");
    }
    if (t.includes("piernas") || t.includes("pantorrilla") || t.includes("muslo") || t.includes("rodilla")) {
      tags.add("piernas");
    }

    // Estado emocional / sueño
    if (t.includes("estres") || t.includes("estrés") || t.includes("ansiedad") || t.includes("ansiosa") || t.includes("ansioso") || t.includes("nervios")) {
      tags.add("estres");
      tags.add("ansiedad");
    }
    if (t.includes("sueno") || t.includes("sueño") || t.includes("no puedo dormir") ||
        t.includes("insomnio") || t.includes("duermo mal") || t.includes("no descanso")) {
      tags.add("sueno");
    }

    // Circulación
    if (t.includes("circulacion") || t.includes("circulación") || t.includes("mala circulacion") ||
        t.includes("hinchad") || t.includes("pesadas") || t.includes("pesadez") || t.includes("retencion")) {
      tags.add("circulacion");
      tags.add("piernas");
    }

    // Deporte
    if (t.includes("maraton") || t.includes("maratón") || t.includes("correr") || t.includes("corr") ||
        t.includes("gym") || t.includes("deporte") || t.includes("entrenamiento")) {
      tags.add("deporte");
    }

    // Intensidad / crónico
    if (t.includes("mucho dolor") || t.includes("no aguanto") || t.includes("intenso") ||
        t.includes("10/10") || t.includes("9/10")) {
      tags.add("dolor_fuerte");
    }
    if (t.includes("anos") || t.includes("años") || t.includes("cronico") || t.includes("crónico") ||
        t.includes("hace mucho tiempo") || t.includes("varios meses") || t.includes("varios años")) {
      tags.add("cronico");
    }
    if (t.includes("todo el cuerpo") || t.includes("varias partes") || t.includes("muchas zonas")) {
      tags.add("multiples_zonas");
    }

    // Si no detectamos nada concreto:
    if (tags.size === 0) {
      tags.add("general");
      tags.add("leve");
    } else if (![...tags].some(tg => ["cronico", "dolor_fuerte"].includes(tg))) {
      tags.add("leve");
    }

    return [...tags];
  }

  function scoreItem(itemTags, userTags) {
    let score = 0;
    for (const tag of itemTags) {
      if (userTags.includes(tag)) score += 2;
    }
    // Bonos
    if (userTags.includes("circulacion") && itemTags.includes("circulacion")) score += 2;
    if (userTags.includes("deporte") && itemTags.includes("deporte")) score += 2;
    if (userTags.includes("cronico") && itemTags.includes("cronico")) score += 2;
    if (userTags.includes("dolor_fuerte") && itemTags.includes("dolor_fuerte")) score += 2;
    return score;
  }

  function buildRecommendation(rawText) {
    const tags = extractTags(rawText);

    // Servicios recomendados (combo)
    const scoredServices = SERVICES
      .map(s => ({ ...s, score: scoreItem(s.tags, tags) }))
      .sort((a, b) => b.score - a.score);

    let combo = scoredServices.filter(s => s.score > 0).slice(0, 3);
    if (combo.length === 0) {
      combo = [SERVICES.find(s => s.id === "relajante")];
    } else if (combo.length === 1) {
      // Forzar combo mínimo de 2 servicios cuando tiene solo uno fuerte
      const extra = SERVICES.find(s => s.id !== combo[0].id && s.id === "relajante");
      if (extra) combo.push(extra);
    }

    // Paquete principal + alternativo
    const scoredPackages = PACKAGES
      .map(p => ({ ...p, score: scoreItem(p.tags, tags) }))
      .sort((a, b) => b.score - a.score);

    let mainPackage = scoredPackages[0];
    if (!mainPackage || mainPackage.score === 0) {
      if (tags.includes("circulacion") || tags.includes("piernas") || tags.includes("deporte") || tags.includes("lumbar")) {
        mainPackage = PACKAGES.find(p => p.id === "plus");
      } else if (tags.includes("cronico") || tags.includes("dolor_fuerte") || tags.includes("multiples_zonas")) {
        mainPackage = PACKAGES.find(p => p.id === "renacer");
      } else if (tags.includes("estres") || tags.includes("sueno")) {
        mainPackage = PACKAGES.find(p => p.id === "manual");
      } else {
        mainPackage = PACKAGES.find(p => p.id === "esencial");
      }
    }
    const altPackage = (scoredPackages.length > 1 && scoredPackages[1].score > 0) ? scoredPackages[1] : null;

    // Resumen para WhatsApp
    const resumenLines = [];
    resumenLines.push("Síntomas: " + rawText);
    resumenLines.push("Tags detectados: " + tags.join(", "));
    resumenLines.push("Servicios recomendados: " + combo.map(c => c.name).join(", "));
    resumenLines.push("Paquete recomendado: " + (mainPackage ? mainPackage.name : "por definir"));
    if (altPackage) resumenLines.push("Paquete alternativo sugerido: " + altPackage.name);
    const resumen = resumenLines.join("\n");

    // HTML
    let html = "";
    html += `<p><strong>${userName ? "Gracias por contarme lo que sientes, " + escapeHtml(userName) : "Gracias por contarme lo que sientes"}.</strong></p>`;
    html += `<p>Con lo que me compartes, estos son los <strong>servicios que mejor combinan para tu caso</strong> en Wellness 21PM:</p>`;
    html += "<ul>";
    combo.forEach(s => {
      html += `<li><strong>${s.name}</strong>: ${s.description}</li>`;
    });
    html += "</ul>";

    if (mainPackage) {
      html += `<p>Como <strong>paquete</strong>, el que más te conviene es: <strong>${mainPackage.name}</strong>.</p>`;
      html += `<p>${mainPackage.description}</p>`;
    }
    if (altPackage) {
      html += `<p>También podríamos valorar como alternativa: <strong>${altPackage.name}</strong>.</p>`;
    }

    html += `<p>Si quieres, te ayudo a <strong>agendar una sesión por WhatsApp</strong> con estas recomendaciones.</p>`;

    const waLines = [
      userName ? `Nombre: ${userName}` : "Nombre: (no indicado)",
      resumen
    ];
    const waParam = encodeURIComponent(waLines.join("\n"));
    const waUrl = "https://wa.me/" + WHATSAPP_PHONE + "?text=" + waParam;

    html += `
      <button class="w21-chat-wa-btn" data-wa="${waUrl}">
        <span>📲</span>
        <span>Agendar por WhatsApp</span>
      </button>
    `;

    return html;
  }

  // ----- Apertura / cierre fácil -----
  function openChat() {
    chatRoot.classList.add("open");
    windowEl.setAttribute("aria-hidden", "false");

    if (!messagesEl.dataset.greeted) {
      messagesEl.dataset.greeted = "true";
      addMessage(
        "assistant",
        "<p>Hola, soy <strong>Oscar</strong>, tu asistente virtual de Wellness 21PM.</p>" +
          "<p>Para empezar, ¿podrías decirme <strong>tu nombre</strong>?</p>"
      );
    }
  }

  function closeChat() {
    chatRoot.classList.remove("open");
    windowEl.setAttribute("aria-hidden", "true");
  }

  toggleBtn.addEventListener("click", () => {
    if (chatRoot.classList.contains("open")) {
      closeChat();
    } else {
      openChat();
    }
  });

  closeBtn.addEventListener("click", closeChat);
  backdropEl.addEventListener("click", closeChat);

  // ----- Manejo del formulario -----
  function processUserMessage(value) {
    const trimmed = (value || "").trim();
    if (!trimmed) return;

    addMessage("user", trimmed);

    if (step === "askName") {
      const firstName = trimmed.split(/\s+/)[0];
      userName = firstName;
      step = "askSymptoms";
      addMessage(
        "assistant",
        `<p>Mucho gusto, <strong>${escapeHtml(firstName)}</strong>.</p>` +
          `<p>Ahora cuéntame con tus palabras <strong>qué sientes o qué te preocupa</strong>: por ejemplo, dolor en cuello, espalda baja, piernas cansadas, mucho estrés, no descansar bien…</p>` +
          `<p>Si quieres, también puedes usar los botones de abajo para contestar más rápido.</p>`
      );
      return;
    }

    // Interpretación de síntomas y recomendación
    showTyping();
    setTimeout(() => {
      hideTyping();
      const html = buildRecommendation(trimmed);
      addMessage("assistant", html);
      step = "ready";
    }, 700);
  }

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = inputEl.value;
    inputEl.value = "";
    processUserMessage(value);
  });

  const quickButtons = chatRoot.querySelectorAll("[data-w21-quick]");
  quickButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.getAttribute("data-w21-quick") || "";
      processUserMessage(value);
    });
  });

  // ----- Click en botón de WhatsApp -----
  messagesEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".w21-chat-wa-btn");
    if (!btn) return;
    const url = btn.getAttribute("data-wa");
    if (url) {
      window.open(url, "_blank");
    }
  });
});
