/**
 * script.js — Logique SPA, validation, appel backend, affichage résultats
 */

// ─── Configuration (à remplir avant déploiement) ─────────────────

const APPS_SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycbwpooRbI2GlL9GzGeQz8cXBAc-DkFXdmmqKQIBJ3Asb_j6IiM-i6tOpbWZLJHxtlryDbg/exec"; // URL du Web App Apps Script (après déploiement)
const CALENDLY_URL          = "https://calendly.com/florent-19/appel-decouverte-clone";

// ─── État de l'application ───────────────────────────────────────

let currentState = "form"; // "form" | "loading" | "results"

// ─── Références DOM ──────────────────────────────────────────────

const stateForm    = document.getElementById("state-form");
const stateLoading = document.getElementById("state-loading");
const stateResults = document.getElementById("state-results");
const form         = document.getElementById("pipeline-form");
const errorBanner  = document.getElementById("error-banner");
const submitBtn    = document.getElementById("submit-btn");
const btnRestart   = document.getElementById("btn-restart");
const loadingMsg   = document.getElementById("loading-message");

// ─── Transitions d'état ──────────────────────────────────────────

function setState(newState) {
  currentState = newState;
  stateForm.classList.toggle("active",    newState === "form");
  stateLoading.classList.toggle("active", newState === "loading");
  stateResults.classList.toggle("active", newState === "results");

  // Scroll en haut à chaque transition
  window.scrollTo({ top: 0, behavior: "instant" });
}

// ─── Validation ──────────────────────────────────────────────────

const VALIDATORS = {
  cabinetSize: {
    validate: () => {
      const checked = form.querySelector('input[name="cabinetSize"]:checked');
      return checked ? null : "Veuillez sélectionner la taille de votre cabinet.";
    }
  },
  city: {
    validate: (v) =>
      v.trim().length >= 2
        ? null
        : "Entrez votre ville ou code postal (ex : Lyon, 69000).",
  },
  currentNewClientsPerYear: {
    validate: (v) => {
      const n = Number(v);
      if (v === "" || isNaN(n))  return "Entrez un nombre de clients (ex : 12).";
      if (n < 0)                 return "La valeur ne peut pas être négative.";
      if (n > 500)               return "Valeur trop élevée (max 500).";
      return null;
    }
  },
  avgFeesPerClient: {
    validate: (v) => {
      const n = Number(v);
      if (v === "" || isNaN(n))  return "Entrez un montant d'honoraires (ex : 2500).";
      if (n < 0)                 return "La valeur ne peut pas être négative.";
      if (n > 100000)            return "Valeur trop élevée (max 100 000 €).";
      return null;
    }
  },
  monthlyAdBudget: {
    validate: (v) => v ? null : "Sélectionnez un budget mensuel.",
  },
  firstName: {
    validate: (v) => v.trim().length >= 2 ? null : "Entrez votre prénom.",
  },
  lastName: {
    validate: (v) => v.trim().length >= 2 ? null : "Entrez votre nom.",
  },
  email: {
    validate: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
        ? null
        : "Entrez une adresse email valide (ex : marie@cabinet.fr).",
  },
  phone: {
    // Format FR : 06/07 mobile, 01-05 fixe, ou +33, espaces/tirets tolérés
    validate: (v) =>
      /^(?:\+33|0033|0)[1-9](?:[\s.\-]?\d{2}){4}$/.test(v.trim().replace(/\s/g, ""))
        ? null
        : "Entrez un numéro français valide (ex : 06 12 34 56 78).",
  },
};

function showFieldError(fieldName, message) {
  const errorEl = document.getElementById(fieldName + "-error");
  if (!errorEl) return;
  errorEl.textContent = message;

  // Marque l'input ou le wrapper en erreur
  const input = form.querySelector(`[name="${fieldName}"]`);
  if (input) {
    const wrapper = input.closest(".input-with-suffix");
    if (wrapper) wrapper.classList.toggle("has-error", !!message);
    else         input.classList.toggle("has-error", !!message);
  }
}

function clearFieldError(fieldName) {
  showFieldError(fieldName, "");
}

function validateForm() {
  let isValid = true;

  for (const [fieldName, validator] of Object.entries(VALIDATORS)) {
    let rawValue;
    if (fieldName === "cabinetSize") {
      rawValue = null; // le validateur fait sa propre requête DOM
    } else {
      const el = form.querySelector(`[name="${fieldName}"]`);
      rawValue = el ? el.value : "";
    }

    const error = validator.validate(rawValue);
    if (error) {
      showFieldError(fieldName, error);
      isValid = false;
    } else {
      clearFieldError(fieldName);
    }
  }

  return isValid;
}

// Validation à la volée (blur)
form.addEventListener("focusout", (e) => {
  const name = e.target.name;
  if (!name || !VALIDATORS[name]) return;
  const error = VALIDATORS[name].validate(e.target.value);
  showFieldError(name, error || "");
});

// Revalide les radios au click
form.querySelectorAll('input[name="cabinetSize"]').forEach(radio => {
  radio.addEventListener("change", () => {
    clearFieldError("cabinetSize");
  });
});

// ─── Animation loading ────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Analyse de votre zone…",
  "Calcul du pipeline…",
  "Préparation de votre rapport…",
];
const EXTRA_MESSAGE = "On y est presque…";

async function runLoadingAnimation() {
  const STEP_MS = 1000;
  const TOTAL_MS = LOADING_MESSAGES.length * STEP_MS; // 3 000 ms

  for (let i = 0; i < LOADING_MESSAGES.length; i++) {
    // Transition fondue
    loadingMsg.classList.add("fade");
    await sleep(200);
    loadingMsg.textContent = LOADING_MESSAGES[i];
    loadingMsg.classList.remove("fade");
    await sleep(STEP_MS - 200);
  }

  return TOTAL_MS;
}

// Démarre le message "presque" si le backend est lent
function startExtraMessage(afterMs) {
  return setTimeout(() => {
    loadingMsg.classList.add("fade");
    setTimeout(() => {
      loadingMsg.textContent = EXTRA_MESSAGE;
      loadingMsg.classList.remove("fade");
    }, 200);
  }, afterMs);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Appel backend ────────────────────────────────────────────────

async function callBackend(payload) {
  console.log("[pipeline] Envoi au backend :", payload);

  const response = await fetch(APPS_SCRIPT_ENDPOINT, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} — ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[pipeline] Réponse backend :", data);
  return data;
}

// ─── Affichage des résultats ──────────────────────────────────────

function populateResults(results, input) {
  // Phrase de synthèse
  document.getElementById("res-budget-display").textContent  = formatEuros(results.monthlyAdBudget);
  document.getElementById("res-clients-monthly").textContent = results.clientsSignedMonthly + " nouveau(x) client(s)";
  document.getElementById("res-clients-yearly").textContent  = results.clientsSignedYearly;
  document.getElementById("res-revenue").textContent         = formatEuros(results.additionalAnnualRevenue);

  // 4 cartes KPI
  document.getElementById("kpi-budget").textContent         = formatEuros(results.monthlyAdBudget) + " / mois";
  document.getElementById("kpi-rdv").textContent            = results.rdvShownMonthly + " RDV";
  document.getElementById("kpi-clients-monthly").textContent = results.clientsSignedMonthly + " client(s)";
  document.getElementById("kpi-revenue").textContent        = formatEuros(results.additionalAnnualRevenue);

  // Alerte capacité
  document.getElementById("capacity-warning").hidden = !results.cappedByCapacity;

  // Comparaison avant / après
  const currentClients = Number(input.currentNewClientsPerYear);
  const currentRevenue = results.currentAnnualRevenueFromNewClients;

  document.getElementById("comp-clients-before").textContent = currentClients + " clients / an";
  document.getElementById("comp-revenue-before").textContent = formatEuros(currentRevenue) + " / an";
  document.getElementById("comp-clients-after").textContent  =
    "+" + results.clientsSignedYearly + " clients / an";
  document.getElementById("comp-revenue-after").textContent  =
    "+" + formatEuros(results.additionalAnnualRevenue) + " / an";

  // Détail pipeline
  document.getElementById("pipe-budget").textContent      = formatEuros(results.monthlyAdBudget) + " / mois";
  document.getElementById("pipe-rdv-booked").textContent  = results.rdvBookedMonthly + " RDV";
  document.getElementById("pipe-rdv-shown").textContent   = results.rdvShownMonthly  + " RDV";
  document.getElementById("pipe-clients-signed").textContent = results.clientsSignedMonthly + " client(s)";

  // Calendly inline
  loadCalendly();
}

function formatEuros(n) {
  return Math.round(n).toLocaleString("fr-FR") + " €";
}

function loadCalendly() {
  if (CALENDLY_URL === "À_REMPLIR") {
    // Mode dev : affiche un placeholder
    document.getElementById("calendly-widget").innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#aaa;font-size:14px;padding:40px;">⚙️ Calendly — à configurer dans script.js (variable CALENDLY_URL)</div>';
    return;
  }

  // Chargement du script officiel Calendly
  if (!document.getElementById("calendly-script")) {
    const script = document.createElement("script");
    script.id  = "calendly-script";
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => initCalendlyWidget();
    document.head.appendChild(script);

    const css = document.createElement("link");
    css.rel  = "stylesheet";
    css.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.appendChild(css);
  } else {
    initCalendlyWidget();
  }
}

function initCalendlyWidget() {
  if (typeof Calendly === "undefined") return;
  Calendly.initInlineWidget({
    url:    CALENDLY_URL,
    parentElement: document.getElementById("calendly-widget"),
    prefill: {},
    utm: {}
  });
}

// ─── Submit du formulaire ─────────────────────────────────────────

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Masque la bannière d'erreur précédente
  errorBanner.hidden = true;

  // Validation complète
  if (!validateForm()) {
    // Scroll vers la première erreur
    const firstError = form.querySelector(".field-error:not(:empty), .has-error");
    if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // Collecte des données
  const cabinetSizeEl = form.querySelector('input[name="cabinetSize"]:checked');
  const input = {
    cabinetSize:              cabinetSizeEl?.value,
    city:                     form.city.value.trim(),
    currentNewClientsPerYear: Number(form.currentNewClientsPerYear.value),
    avgFeesPerClient:         Number(form.avgFeesPerClient.value),
    monthlyAdBudget:          Number(form.monthlyAdBudget.value),
    firstName:                form.firstName.value.trim(),
    lastName:                 form.lastName.value.trim(),
    email:                    form.email.value.trim(),
    phone:                    form.phone.value.trim(),
  };

  // Tracking analytics (GA4 / Meta Pixel — à brancher)
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event:          "pipeline_form_submit",
      cabinet_size:   input.cabinetSize,
      monthly_budget: input.monthlyAdBudget,
      city:           input.city,
    });
    console.log("[tracking] pipeline_form_submit", input);
  } catch (trackErr) {
    console.warn("[tracking] Erreur dataLayer :", trackErr);
  }

  // Désactive le bouton
  submitBtn.disabled = true;

  // Passe en mode loading
  setState("loading");

  // Lance l'animation ET l'appel réseau en parallèle
  const ANIMATION_TOTAL_MS = 3000;
  const extraTimer = startExtraMessage(5000); // message "presque" si > 5s

  let backendResults = null;
  let backendError   = null;

  const [_animDone, backendResponse] = await Promise.allSettled([
    sleep(ANIMATION_TOTAL_MS), // garantit au moins 3s d'animation
    callBackend(input).catch(err => { backendError = err; return null; }),
  ]);

  clearTimeout(extraTimer);

  // Si on est revenu avant la fin de l'animation (impossible ici mais sécurité)
  backendResults = backendResponse.value;

  // Calcul côté front (indépendant du backend pour l'affichage immédiat)
  const localResults = calculatePipeline(input);

  if (backendError || !localResults) {
    console.error("[pipeline] Erreur :", backendError);
    setState("form");
    submitBtn.disabled = false;
    errorBanner.hidden = false;
    errorBanner.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  // Utilise les résultats backend si disponibles, sinon ceux du front
  const results = (backendResults?.results) || localResults;

  // Peuple l'état résultats
  populateResults(results, input);

  // Transition vers l'état résultats
  setState("results");
});

// ─── Bouton "Refaire la simulation" ──────────────────────────────

btnRestart.addEventListener("click", () => {
  submitBtn.disabled = false;
  setState("form");
});

// ─── Init ─────────────────────────────────────────────────────────

setState("form");
console.log("[pipeline] Prêt. Endpoint :", APPS_SCRIPT_ENDPOINT);
