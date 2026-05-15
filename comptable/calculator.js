/**
 * calculator.js — Logique de calcul du pipeline d'acquisition
 * Tous les paramètres métier sont regroupés en constantes en haut du fichier.
 */

// ─── Paramètres métier (à ajuster sans toucher au reste du code) ───

const CPL_BY_BUDGET = {
  500:  130,
  1000: 110,
  1500:  95,
  2000:  85,
  3000:  75,
  5000:  70
};

const SHOW_RATE  = 0.70; // Taux de présence aux RDV
const CLOSE_RATE = 0.30; // Taux de closing en RDV

// Plafond mensuel de nouveaux clients par taille de cabinet
const SIZE_CAP_MONTHLY = {
  "solo": 3,
  "2-5":  8,
  "6-20": 15,
  "20+":  30
};

// ─── Utilitaires d'affichage ──────────────────────────────────────

/**
 * Formate un nombre entier avec espace millier.
 * Ex : 47320 → "47 320"
 */
function formatNumber(n) {
  return Math.round(n).toLocaleString("fr-FR");
}

/**
 * Formate un montant en euros avec espace millier.
 * Ex : 47320 → "47 320 €"
 */
function formatEuros(n) {
  return formatNumber(n) + " €";
}

/**
 * Arrondit intelligemment : entiers pour les petits nombres, arrondi
 * au demi-entier pour ceux entre 1 et 5, pour un affichage lisible.
 */
function smartRound(n) {
  if (n < 1) return parseFloat(n.toFixed(1));
  if (n < 5) return parseFloat(n.toFixed(1));
  return Math.round(n);
}

// ─── Fonction principale exportée ────────────────────────────────

/**
 * calculatePipeline — calcule la projection d'acquisition mensuelle et annuelle.
 *
 * @param {Object} input
 * @param {"solo"|"2-5"|"6-20"|"20+"} input.cabinetSize
 * @param {string}  input.city
 * @param {number}  input.currentNewClientsPerYear
 * @param {number}  input.avgFeesPerClient
 * @param {number}  input.monthlyAdBudget  — clé de CPL_BY_BUDGET
 * @param {string}  input.email
 * @param {string}  input.phone
 *
 * @returns {Object} résultats bruts + libellés formatés
 */
function calculatePipeline(input) {
  const budget = Number(input.monthlyAdBudget);
  const cpl    = CPL_BY_BUDGET[budget];

  if (!cpl) {
    console.error("[calculator] Budget inconnu :", budget);
    return null;
  }

  // Calcul du pipeline brut
  const rdvBookedMonthlyRaw       = budget / cpl;
  const rdvShownMonthlyRaw        = rdvBookedMonthlyRaw * SHOW_RATE;
  const clientsSignedMonthlyRaw   = rdvShownMonthlyRaw  * CLOSE_RATE;
  const cap                       = SIZE_CAP_MONTHLY[input.cabinetSize] || 5;
  const clientsSignedMonthly      = Math.min(clientsSignedMonthlyRaw, cap);
  const cappedByCapacity          = clientsSignedMonthlyRaw > cap;

  const clientsSignedYearly            = clientsSignedMonthly * 12;
  const additionalAnnualRevenue        = clientsSignedYearly  * Number(input.avgFeesPerClient);
  const currentAnnualRevenueFromNew    = Number(input.currentNewClientsPerYear) * Number(input.avgFeesPerClient);

  // Arrondis pour l'affichage
  const rdvBookedMonthly = smartRound(rdvBookedMonthlyRaw);
  const rdvShownMonthly  = smartRound(rdvShownMonthlyRaw);

  return {
    // Valeurs brutes
    rdvBookedMonthly,
    rdvShownMonthly,
    clientsSignedMonthly:       smartRound(clientsSignedMonthly),
    clientsSignedYearly:        Math.round(clientsSignedYearly),
    additionalAnnualRevenue:    Math.round(additionalAnnualRevenue),
    cappedByCapacity,
    currentAnnualRevenueFromNewClients: Math.round(currentAnnualRevenueFromNew),
    monthlyAdBudget:            budget,

    // Libellés formatés prêts à injecter dans le DOM
    fmt: {
      budget:                   formatEuros(budget) + " / mois",
      rdvBooked:                rdvBookedMonthly + " RDV / mois",
      rdvShown:                 rdvShownMonthly  + " RDV / mois",
      clientsMonthly:           smartRound(clientsSignedMonthly) + " client(s) / mois",
      clientsYearly:            Math.round(clientsSignedYearly)  + " clients / an",
      additionalRevenue:        formatEuros(additionalAnnualRevenue) + " / an",
      currentRevenue:           formatEuros(currentAnnualRevenueFromNew) + " / an",
      currentClientsYearly:     Number(input.currentNewClientsPerYear) + " clients / an",
      totalClientsYearly:       (Number(input.currentNewClientsPerYear) + Math.round(clientsSignedYearly)) + " clients / an",
      totalRevenue:             formatEuros(currentAnnualRevenueFromNew + additionalAnnualRevenue) + " / an",
    }
  };
}
