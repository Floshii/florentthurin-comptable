/**
 * Code.gs — Backend Google Apps Script pour la landing page comptable
 *
 * SETUP :
 * 1. Coller ce code dans script.google.com → nouveau projet
 * 2. Remplir les 3 constantes ci-dessous
 * 3. Déployer → Déploiement → Nouvelle version → Web App
 *    - Exécuter en tant que : Moi
 *    - Accès : Tout le monde (anonyme)
 * 4. Copier l'URL du Web App → coller dans script.js (APPS_SCRIPT_ENDPOINT)
 */

// ─── Configuration ────────────────────────────────────────────────

const SHEET_ID      = "1barmgxB5oI4NDW1Y4ou15w5zAQHtB5-aTYvMwCVNY3w";
const NOTIFY_EMAIL  = "florent@florentthurin.com";
const CALENDLY_URL  = "https://calendly.com/florent-19/appel-decouverte-clone";

// ─── Paramètres métier (miroir de calculator.js — doit rester synchronisé) ──

const CPL_BY_BUDGET = {
  500:  130,
  1000: 110,
  1500:  95,
  2000:  85,
  3000:  75,
  5000:  70
};

const SHOW_RATE  = 0.70;
const CLOSE_RATE = 0.30;

const SIZE_CAP_MONTHLY = {
  "solo": 3,
  "2-5":  8,
  "6-20": 15,
  "20+":  30
};

// ─── Point d'entrée HTTP ──────────────────────────────────────────

function doPost(e) {
  const headers = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const body    = JSON.parse(e.postData.contents);
    const results = computePipeline(body);

    // Enregistrement dans la Sheet
    appendToSheet(body, results);

    // Génération du PDF + envoi email
    sendReportEmail(body, results);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, results: results }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("Erreur doPost : " + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Réponse aux preflight OPTIONS (CORS)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Calcul (identique à calculator.js) ──────────────────────────

function computePipeline(input) {
  const budget = Number(input.monthlyAdBudget);
  const cpl    = CPL_BY_BUDGET[budget];
  if (!cpl) throw new Error("Budget inconnu : " + budget);

  const rdvBookedMonthlyRaw     = budget / cpl;
  const rdvShownMonthlyRaw      = rdvBookedMonthlyRaw * SHOW_RATE;
  const clientsSignedMonthlyRaw = rdvShownMonthlyRaw  * CLOSE_RATE;
  const cap                     = SIZE_CAP_MONTHLY[input.cabinetSize] || 5;
  const clientsSignedMonthly    = Math.min(clientsSignedMonthlyRaw, cap);
  const cappedByCapacity        = clientsSignedMonthlyRaw > cap;

  const clientsSignedYearly         = clientsSignedMonthly * 12;
  const additionalAnnualRevenue     = clientsSignedYearly  * Number(input.avgFeesPerClient);
  const currentAnnualRevenue        = Number(input.currentNewClientsPerYear) * Number(input.avgFeesPerClient);

  return {
    rdvBookedMonthly:                  Math.round(rdvBookedMonthlyRaw * 10) / 10,
    rdvShownMonthly:                   Math.round(rdvShownMonthlyRaw  * 10) / 10,
    clientsSignedMonthly:              Math.round(clientsSignedMonthly * 10) / 10,
    clientsSignedYearly:               Math.round(clientsSignedYearly),
    additionalAnnualRevenue:           Math.round(additionalAnnualRevenue),
    cappedByCapacity:                  cappedByCapacity,
    currentAnnualRevenueFromNewClients: Math.round(currentAnnualRevenue),
    monthlyAdBudget:                   budget
  };
}

// ─── Écriture dans la Sheet ───────────────────────────────────────

function appendToSheet(input, results) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Leads") || ss.insertSheet("Leads");

  // Crée l'en-tête si la feuille est vide
  if (sheet.getLastRow() === 0) {
    const headers = [
      "Date & heure (timestamp)",
      "Prénom",
      "Nom",
      "Email",
      "Téléphone",
      "Taille du cabinet",
      "Ville / Code postal",
      "Nouveaux clients actuels / an",
      "Honoraires moyens / client (€)",
      "Budget pub mensuel (€)",
      "RDV générés / mois (brut)",
      "RDV effectifs / mois (70 % présence)",
      "Clients signés / mois",
      "Clients signés / an",
      "CA additionnel estimé / an (€)",
      "Projection plafonnée capacité ?",
      "CA actuel issu des nouveaux clients (€)"
    ];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#111111");
    headerRange.setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    new Date(),
    input.firstName  || "",
    input.lastName   || "",
    input.email      || "",
    input.phone      || "",
    input.cabinetSize,
    input.city,
    input.currentNewClientsPerYear,
    input.avgFeesPerClient,
    input.monthlyAdBudget,
    results.rdvBookedMonthly,
    results.rdvShownMonthly,
    results.clientsSignedMonthly,
    results.clientsSignedYearly,
    results.additionalAnnualRevenue,
    results.cappedByCapacity ? "Oui" : "Non",
    results.currentAnnualRevenueFromNewClients
  ]);
}

// ─── Génération PDF & envoi email ─────────────────────────────────

function sendReportEmail(input, results) {
  const firstName = input.firstName || "Votre cabinet";
  const lastName  = input.lastName  || "";
  const fullName  = (firstName + " " + lastName).trim();
  const cabinetLabel = {
    "solo": "Cabinet solo",
    "2-5":  "Cabinet 2–5 personnes",
    "6-20": "Cabinet 6–20 personnes",
    "20+":  "Grand cabinet (20+ personnes)"
  }[input.cabinetSize] || input.cabinetSize;

  const htmlContent = buildReportHtml(fullName, cabinetLabel, input, results);

  // Génère le PDF via Drive
  const blob = HtmlService
    .createHtmlOutput(htmlContent)
    .getBlob()
    .setName("Simulation-Pipeline-" + firstName + "-" + lastName + ".pdf");

  // Utilise DriveApp pour convertir en PDF propre
  const tempFile  = DriveApp.createFile(blob);
  const pdfBlob   = tempFile.getAs("application/pdf");
  pdfBlob.setName("Simulation-Pipeline-" + firstName + ".pdf");
  tempFile.setTrashed(true); // nettoyage

  const subject = "Votre simulation pipeline · cabinet " + firstName + " " + lastName;

  // Email au prospect
  MailApp.sendEmail({
    to:          input.email,
    subject:     subject,
    htmlBody:    buildEmailHtml(fullName, results),
    attachments: [pdfBlob],
    name:        "Florent Thurin · florentthurin.com"
  });

  // Copie BCC à Florent
  MailApp.sendEmail({
    to:          NOTIFY_EMAIL,
    subject:     "[Nouveau lead] " + subject,
    htmlBody:    buildEmailHtml(fullName, results) + buildAdminExtra(input, results),
    attachments: [pdfBlob],
    name:        "Pipeline Comptable — Notif"
  });
}

// ─── Templates HTML ───────────────────────────────────────────────

function fmt(n) { return n.toLocaleString("fr-FR"); }
function fmtE(n) { return fmt(n) + " €"; }

function buildReportHtml(fullName, cabinetLabel, input, results) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 0; }
  .header { background: #111; color: #fff; padding: 32px 40px; }
  .header-logo { font-size: 13px; color: rgba(255,255,255,0.5); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
  .header-logo span { color: #FF6B1A; }
  .header h1 { font-size: 24px; font-weight: 800; margin: 0; }
  .body { padding: 36px 40px; }
  .section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin: 28px 0 14px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; }
  .kpi { flex: 1; background: #f5f5f5; border-radius: 10px; padding: 18px 16px; text-align: center; }
  .kpi.accent { background: #FF6B1A; color: #fff; }
  .kpi-value { font-size: 22px; font-weight: 800; display: block; }
  .kpi-label { font-size: 11px; color: #888; display: block; margin-top: 4px; }
  .kpi.accent .kpi-label { color: rgba(255,255,255,0.7); }
  .summary-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 10px; padding: 20px 24px; margin-bottom: 16px; font-size: 15px; line-height: 1.8; }
  .summary-box strong { color: #FF6B1A; }
  .cta-box { background: #111; color: #fff; border-radius: 12px; padding: 28px 32px; text-align: center; margin-top: 32px; }
  .cta-box h2 { font-size: 20px; font-weight: 800; margin-bottom: 10px; }
  .cta-box p { font-size: 14px; color: rgba(255,255,255,0.65); margin-bottom: 20px; }
  .cta-btn { display: inline-block; background: #FF6B1A; color: #fff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; text-decoration: none; }
  .footer { margin-top: 40px; padding: 20px 40px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="header-logo">florentthurin<span>.com</span> · Agence Lead Gen B2B</div>
  <h1>Votre simulation pipeline</h1>
</div>
<div class="body">
  <p style="font-size:15px;margin-bottom:4px;">Bonjour <strong>${fullName}</strong>,</p>
  <p style="font-size:14px;color:#666;margin-bottom:24px;">Voici votre simulation personnalisée pour ${cabinetLabel} · ${input.city}</p>

  <div class="summary-box">
    Avec <strong>${fmtE(results.monthlyAdBudget)} / mois</strong> en publicité en ligne, votre cabinet peut
    signer <strong>${results.clientsSignedMonthly} nouveau(x) client(s) par mois</strong>, soit
    <strong>${results.clientsSignedYearly} clients sur l'année</strong> pour
    <strong>${fmtE(results.additionalAnnualRevenue)} de CA additionnel</strong>.
  </div>

  <div class="section-title">Résultats clés</div>
  <div class="kpi-row">
    <div class="kpi">
      <span class="kpi-value">${results.rdvShownMonthly}</span>
      <span class="kpi-label">RDV qualifiés / mois</span>
    </div>
    <div class="kpi">
      <span class="kpi-value">${results.clientsSignedMonthly}</span>
      <span class="kpi-label">Clients signés / mois</span>
    </div>
    <div class="kpi">
      <span class="kpi-value">${results.clientsSignedYearly}</span>
      <span class="kpi-label">Clients signés / an</span>
    </div>
    <div class="kpi accent">
      <span class="kpi-value">${fmtE(results.additionalAnnualRevenue)}</span>
      <span class="kpi-label">CA additionnel / an</span>
    </div>
  </div>

  <div class="section-title">Comment ce pipeline fonctionne</div>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <tr style="background:#f5f5f5;">
      <td style="padding:10px 14px;font-weight:600;">Budget mensuel</td>
      <td style="padding:10px 14px;text-align:right;">${fmtE(results.monthlyAdBudget)}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;color:#555;">RDV générés (budget ÷ coût par lead)</td>
      <td style="padding:10px 14px;text-align:right;">${results.rdvBookedMonthly} RDV</td>
    </tr>
    <tr style="background:#f5f5f5;">
      <td style="padding:10px 14px;color:#555;">RDV effectifs (taux présence 70 %)</td>
      <td style="padding:10px 14px;text-align:right;">${results.rdvShownMonthly} RDV</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;font-weight:700;">Clients signés / mois (closing 30 %)</td>
      <td style="padding:10px 14px;text-align:right;font-weight:700;color:#FF6B1A;">${results.clientsSignedMonthly} client(s)</td>
    </tr>
  </table>

  ${results.cappedByCapacity ? `
  <p style="margin-top:16px;font-size:12px;color:#7a4400;background:#fff8f0;border:1px solid #ffd4a8;border-radius:6px;padding:12px 16px;">
    ⚠️ Cette projection est plafonnée par la capacité d'accueil estimée de votre cabinet.
    Le budget pourrait générer plus de RDV que vous ne pouvez en absorber actuellement.
  </p>` : ""}

  <div class="cta-box">
    <h2>Passons à l'action</h2>
    <p>Réservez un audit gratuit de 30 minutes pour valider la stratégie ensemble.</p>
    <a class="cta-btn" href="${CALENDLY_URL}">Réserver mon audit gratuit →</a>
  </div>
</div>
<div class="footer">
  florentthurin.com · florent@florentthurin.com · Ce document est confidentiel et destiné uniquement à son destinataire.
</div>
</body>
</html>`;
}

function buildEmailHtml(fullName, results) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; }
  .header { background: #111; padding: 24px 32px; }
  .logo-text { color: #fff; font-weight: 800; font-size: 15px; }
  .logo-text span { color: #FF6B1A; }
  .body { padding: 32px; }
  .highlight { color: #FF6B1A; font-weight: 700; }
  .kpi-row { display: flex; gap: 10px; margin: 24px 0; }
  .kpi { flex: 1; background: #f5f5f5; border-radius: 8px; padding: 14px; text-align: center; }
  .kpi-v { font-size: 20px; font-weight: 800; color: #111; display: block; }
  .kpi-l { font-size: 11px; color: #888; display: block; margin-top: 3px; }
  .cta { display: inline-block; margin: 8px 0; background: #FF6B1A; color: #fff; font-weight: 700; padding: 14px 28px; border-radius: 8px; text-decoration: none; }
  .footer { padding: 20px 32px; font-size: 11px; color: #aaa; border-top: 1px solid #eee; }
</style>
</head>
<body>
<div class="header"><span class="logo-text">florentthurin<span>.com</span></span></div>
<div class="body">
  <p>Bonjour <strong>${fullName}</strong>,</p>
  <p style="margin:16px 0;">Merci d'avoir utilisé le calculateur de pipeline. Votre rapport personnalisé est en pièce jointe.</p>
  <p>En résumé, avec <span class="highlight">${fmtE(results.monthlyAdBudget)} / mois</span>, votre cabinet peut signer
  <span class="highlight">${results.clientsSignedMonthly} nouveau(x) client(s) / mois</span> pour
  <span class="highlight">${fmtE(results.additionalAnnualRevenue)} de CA additionnel / an</span>.</p>

  <div class="kpi-row">
    <div class="kpi"><span class="kpi-v">${results.rdvShownMonthly}</span><span class="kpi-l">RDV / mois</span></div>
    <div class="kpi"><span class="kpi-v">${results.clientsSignedMonthly}</span><span class="kpi-l">Clients / mois</span></div>
    <div class="kpi"><span class="kpi-v">${fmtE(results.additionalAnnualRevenue)}</span><span class="kpi-l">CA / an</span></div>
  </div>

  <p>La prochaine étape ? Un audit gratuit de 30 minutes pour valider la stratégie ensemble et voir des résultats concrets.</p>
  <p style="margin-top:20px;"><a class="cta" href="${CALENDLY_URL}">Réserver mon audit gratuit →</a></p>
  <p style="margin-top:24px;font-size:13px;color:#888;">À bientôt,<br><strong>Florent Thurin</strong><br>florentthurin.com</p>
</div>
<div class="footer">
  Vous recevez cet email parce que vous avez utilisé notre calculateur de pipeline.
  Aucun démarchage sans votre accord.
</div>
</body>
</html>`;
}

function buildAdminExtra(input, results) {
  return `<hr style="margin:32px 0;border:1px solid #eee;">
<p style="font-size:13px;color:#555;"><strong>Données du lead :</strong></p>
<table style="font-size:13px;border-collapse:collapse;">
  <tr><td style="padding:4px 12px 4px 0;color:#888;">Nom</td><td>${input.firstName} ${input.lastName}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888;">Email</td><td>${input.email}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888;">Téléphone</td><td>${input.phone}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888;">Cabinet</td><td>${input.cabinetSize} · ${input.city}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888;">Budget</td><td>${fmtE(results.monthlyAdBudget)}/mois</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#888;">CA additionnel</td><td>${fmtE(results.additionalAnnualRevenue)}/an</td></tr>
</table>`;
}
