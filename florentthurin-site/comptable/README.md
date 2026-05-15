# Landing Comptable — florentthurin.com/comptable

Calculateur de pipeline d'acquisition pour cabinets comptables.  
Stack : HTML/CSS/JS vanilla · Backend Google Apps Script · Hébergement Vercel.

---

## Arborescence

```
comptable/
├── index.html          ← Page principale (3 états SPA)
├── styles.css          ← Design mobile-first
├── script.js           ← Logique SPA, validation, fetch
├── calculator.js       ← Fonction calculatePipeline()
├── vercel.json         ← Headers sécurité + routing
├── apps-script/
│   └── Code.gs         ← Backend Google Apps Script
└── assets/
    ├── og.png          ← Image Open Graph 1200×630 (à créer)
    └── favicon.ico     ← Favicon (à ajouter)
```

---

## Setup étape par étape

### 1. Google Sheet

1. Créez une nouvelle Google Sheet sur [sheets.google.com](https://sheets.google.com).
2. Copiez son **ID** depuis l'URL :  
   `https://docs.google.com/spreadsheets/d/`**`CECI_EST_L_ID`**`/edit`

---

### 2. Google Apps Script

1. Allez sur [script.google.com](https://script.google.com) → **Nouveau projet**.
2. Copiez le contenu de `apps-script/Code.gs` dans l'éditeur.
3. Remplissez les 3 constantes en haut du fichier :

```javascript
const SHEET_ID     = "VOTRE_ID_SHEET";
const NOTIFY_EMAIL = "florent@florentthurin.com"; // déjà rempli
const CALENDLY_URL = "https://calendly.com/votre-url/audit";
```

4. **Déployez** : menu **Déployer → Nouvelle version → Web App**
   - *Exécuter en tant que* : **Moi**
   - *Accès* : **Tout le monde (anonyme)**
5. Autorisez les permissions Google demandées.
6. Copiez l'**URL du Web App** (format `https://script.google.com/macros/s/…/exec`).

---

### 3. Variables frontend

Dans `script.js`, remplissez en haut du fichier :

```javascript
const APPS_SCRIPT_ENDPOINT = "https://script.google.com/macros/s/…/exec";
const CALENDLY_URL          = "https://calendly.com/votre-url/audit";
```

---

### 4. Assets (optionnel mais recommandé pour le SEO)

- **`assets/og.png`** : image 1200×630 px (fond sombre, logo, texte accrocheur).
- **`assets/favicon.ico`** : favicon 32×32 px.

---

### 5. Déploiement Vercel

```bash
# Depuis la racine du repo (pas depuis /comptable)
git add comptable/
git commit -m "feat: landing page comptable avec calculateur pipeline"
git push origin main
```

Vercel détecte le push automatiquement et déploie.  
La page sera accessible à `https://florentthurin.com/comptable`.

> **Si Vercel n'est pas encore configuré sur ce repo :**  
> ```bash
> npx vercel --prod
> ```
> Suivez l'assistant, liez votre repo GitHub, choisissez le domaine.

---

### 6. Test en local

```bash
# Option 1 — Python (intégré macOS)
cd comptable
python3 -m http.server 8080
# → http://localhost:8080

# Option 2 — npx serve (Node.js requis)
npx serve comptable -p 8080
# → http://localhost:8080
```

> ⚠️ En local, le formulaire affichera une erreur réseau car `APPS_SCRIPT_ENDPOINT` vaut `"À_REMPLIR"`.  
> C'est normal. Le calculateur frontend fonctionne lui sans backend.

---

## Tracking Analytics

Le submit du formulaire pousse déjà dans `window.dataLayer` :

```javascript
{
  event:          "pipeline_form_submit",
  cabinet_size:   "2-5",
  monthly_budget: 2000,
  city:           "Lyon"
}
```

Pour brancher **Google Analytics 4** :

```html
<!-- dans <head> de index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Pour **Meta Pixel**, ajoutez le snippet standard avant `</head>` avec votre Pixel ID.

---

## Paramètres métier à ajuster

Tous les paramètres sont en constantes en tête de `calculator.js` **et** de `Code.gs` (à garder synchronisés) :

| Constante | Valeur par défaut | Rôle |
|-----------|-------------------|------|
| `CPL_BY_BUDGET` | 70–130 € | Coût par lead selon budget |
| `SHOW_RATE` | 0.70 | Taux de présence aux RDV |
| `CLOSE_RATE` | 0.30 | Taux de closing en RDV |
| `SIZE_CAP_MONTHLY` | 3–30 | Plafond clients/mois selon taille |

---

## Checklist avant mise en prod

- [ ] `APPS_SCRIPT_ENDPOINT` rempli dans `script.js`
- [ ] `CALENDLY_URL` rempli dans `script.js` et `Code.gs`
- [ ] `SHEET_ID` rempli dans `Code.gs`
- [ ] Web App Apps Script déployé avec accès "Tout le monde"
- [ ] `assets/og.png` créé (1200×630)
- [ ] `assets/favicon.ico` ajouté
- [ ] Test complet du formulaire en prod (vérifier email + Sheet)
- [ ] GA4 / Meta Pixel branchés si besoin
