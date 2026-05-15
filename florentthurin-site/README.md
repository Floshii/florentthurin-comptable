# florentthurin.com

Site personnel one-page bilingue FR/EN — vanilla HTML/CSS/JS, zéro dépendance.

## Structure des fichiers

```
florentthurin-site/
├── index.html        # Structure, SEO, JSON-LD
├── styles.css        # Design system + responsive
├── script.js         # i18n, animations, interactions
├── assets/
│   ├── favicon.svg   # Favicon orange "FT"
│   ├── portrait.jpg  # → À remplacer (voir ci-dessous)
│   └── og-image.jpg  # → À créer (1200×630px)
└── README.md
```

---

## Checklist avant mise en ligne

Chercher `_HERE` dans `index.html` pour trouver tous les placeholders d'un coup :

```bash
grep -n "_HERE" index.html
```

| Placeholder | Occurrences | Ce qu'il faut mettre |
|---|---|---|
| `CALENDLY_URL_HERE` | 4 | URL de ton Calendly |
| `YOUTUBE_URL_HERE` | 3 | URL de ta chaîne YouTube |
| `YOUTUBE_VIDEO_ID_HERE` | 2 | ID de la vidéo à mettre en avant (ex: `dQw4w9WgXcQ`) |
| `LINKEDIN_URL_HERE` | 4 | URL de ton profil LinkedIn |
| `florent@florentthurin.com` | 1 | Ton email de contact |

---

## Remplacer la photo portrait

1. Nommer le fichier `portrait.jpg` et le mettre dans `/assets/`
2. Dans `index.html`, ligne ~107, remplacer le bloc placeholder :

```html
<!-- SUPPRIMER ça : -->
<div class="photo-placeholder">
  <span class="photo-initials">FT</span>
</div>

<!-- METTRE ça à la place : -->
<img src="/assets/portrait.jpg" alt="Florent Thurin" width="480" height="600" loading="eager" />
```

**Format recommandé :** JPG, ratio 3:4 ou 4:5, largeur min 800px, N&B.

---

## Remplacer les témoignages

Dans `script.js`, modifier l'objet `translations` — section `fr` et `en` :

```js
t1text:   '"Le vrai témoignage ici."',
t1author: '— Prénom Nom',
t1role:   'Titre, Entreprise',
// idem pour t2 et t3
```

---

## Modifier les traductions

Tout le texte du site est dans l'objet `translations` au début de `script.js`.
Deux langues : `fr` et `en`. Chaque clé correspond à un `data-i18n="clé"` dans le HTML.

---

## Activer Plausible Analytics (RGPD-friendly, sans cookies)

1. Créer un compte sur [plausible.io](https://plausible.io)
2. Décommenter la ligne dans `<head>` de `index.html` :

```html
<script defer data-domain="florentthurin.com" src="https://plausible.io/js/script.js"></script>
```

---

## Déployer sur Vercel (recommandé — le plus rapide)

### Option A — Vercel CLI depuis le terminal

```bash
# Installer Vercel CLI (une seule fois)
npm install -g vercel

# Dans le dossier du site
cd florentthurin-site
vercel

# Suivre les instructions :
# → Set up and deploy? Y
# → Which scope? (ton compte)
# → Link to existing project? N
# → Project name: florentthurin-com
# → In which directory is your code located? ./
# → Want to modify settings? N

# URL de preview générée immédiatement.
# Pour mettre en prod :
vercel --prod
```

### Option B — Via GitHub (déploiement automatique à chaque push)

1. Créer un repo GitHub et y pousser le dossier
2. Aller sur [vercel.com](https://vercel.com) → **Add New Project**
3. Importer le repo → laisser tous les paramètres par défaut → **Deploy**
4. Chaque `git push` redéploie automatiquement

### Ajouter le domaine florentthurin.com sur Vercel

1. Dashboard Vercel → ton projet → **Settings → Domains**
2. Ajouter `florentthurin.com` et `www.florentthurin.com`
3. Chez ton registrar (OVH, Namecheap…), configurer les DNS :

| Type | Nom | Valeur |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

La propagation DNS prend 5–30 minutes. HTTPS est automatique.

---

## Déployer sur Netlify (alternative)

### Option A — Drag & drop (le plus simple au monde)

1. Aller sur [app.netlify.com/drop](https://app.netlify.com/drop)
2. Glisser-déposer le dossier `florentthurin-site`
3. C'est en ligne en 30 secondes

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
cd florentthurin-site
netlify deploy --prod --dir .
```

---

## Variables d'environnement

Aucune — tout est statique. Les URLs (Calendly, YouTube, LinkedIn) sont directement dans le HTML.

---

## Performances

- CSS critique inliné dans `<head>` → pas de FOUC
- Fonts avec `font-display: swap` → texte visible immédiatement
- Vidéo YouTube en facade → aucun impact sur le premier chargement
- Images avec `loading="lazy"` sauf la photo hero (`loading="eager"`)

Objectif Lighthouse : Performance > 95, Accessibility > 95, SEO > 95.
