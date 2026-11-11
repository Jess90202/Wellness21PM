// Wellness 21PM · guía de paquetes y reloj de horario
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Guía rápida: al tocar "Esto siento" se marcan los paquetes recomendados.
  const picks = document.querySelectorAll("[data-guide]");
  const plansWrap = document.querySelector(".plans");
  const plans = document.querySelectorAll("[data-plan]");

  const applyGuide = (button) => {
    const wasActive = button.getAttribute("aria-pressed") === "true";
    picks.forEach((pick) => pick.setAttribute("aria-pressed", "false"));
    const wanted = wasActive ? [] : button.dataset.guide.split(" ");
    if (!wasActive) button.setAttribute("aria-pressed", "true");

    plansWrap.classList.toggle("is-filtered", wanted.length > 0);
    plans.forEach((plan) => {
      plan.classList.toggle("is-match", wanted.includes(plan.dataset.plan));
    });

    if (wanted.length > 0) {
      plansWrap.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
    }
  };

  if (plansWrap && picks.length) {
    picks.forEach((pick) => pick.addEventListener("click", () => applyGuide(pick)));
  }

  // Reloj de 24 h: la aguja marca la hora actual de la CDMX.
  const hand = document.getElementById("dial-hand");
  const timeLabel = document.querySelector("[data-dial-time]");
  const MINUTE_MS = 60 * 1000;

  const readMexicoTime = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Mexico_City",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(new Date());
    const value = (type) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    return { hour: value("hour"), minute: value("minute") };
  };

  const updateDial = () => {
    const { hour, minute } = readMexicoTime();
    const degrees = ((hour + minute / 60) / 24) * 360;
    hand.setAttribute("transform", `rotate(${degrees.toFixed(2)} 100 100)`);
    if (timeLabel) {
      timeLabel.textContent = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} h`;
    }
  };

  if (hand) {
    try {
      updateDial();
      window.setInterval(updateDial, MINUTE_MS);
    } catch (error) {
      // Si el navegador no soporta la zona horaria, el reloj se queda sin aguja.
      hand.setAttribute("hidden", "");
      if (timeLabel) timeLabel.textContent = "consulta el horario";
    }
  }
})();
