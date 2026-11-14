# Northbound Logistics — Business Website

A complete, responsive, multi-page website for a fictional **Logistics & Transportation** company.
Pure HTML, CSS and vanilla JavaScript — no frameworks, no build step, no backend — so it deploys to
GitHub Pages or Netlify for free.

> The company name, address, phone, clients, team and statistics are **sample content**.
> Replace them with your own details (see [Customise](#4-customise-it)).

## 1. Requirements checklist

| Requirement | Where it's met |
|---|---|
| At least 6 HTML pages | 7 pages + 2 extras: `index`, `services`, `fleet`, `tracking`, `quote`, `about`, `contact`, `privacy`, `404` |
| Fully responsive | Mobile-first CSS, breakpoints at 1100 / 980 / 680 / 400 px, slide-in mobile menu, tested at 390 px and 1440 px |
| Contact form with validation | `contact.html` and `quote.html` — rule-driven validation (`js/forms.js`): required, email, Indian phone, min length, number range, no past dates, consent, inline errors, ARIA, honeypot spam trap |
| Image optimisation | Responsive `<picture>` with WebP + JPEG fallback, `srcset`/`sizes`, explicit `width`/`height` (no layout shift), lazy-loading, hero preloaded, plus the `tools/optimize_images.py` pipeline (≈90% smaller) |
| Navigation between pages | Shared header/footer on every page, current-page highlight, breadcrumbs, skip link |
| Deploy to free hosting | GitHub Pages and Netlify instructions below; `netlify.toml`, `.nojekyll`, `404.html`, `sitemap.xml`, `robots.txt` included |

**Extra functionality:** shipment tracking demo, instant price estimator on the quote form, animated counters,
scroll-reveal animations, FAQ accordion, JSON-LD structured data, SEO meta tags, `prefers-reduced-motion` support.

## 2. Project structure

```
northbound-logistics/
├── index.html          Home
├── services.html       Six services + FAQ
├── fleet.html          Fleet, technology, hub network
├── tracking.html       Shipment tracking (demo data)
├── quote.html          Quote request form + live estimate
├── about.html          Story, mission, values, timeline, team
├── contact.html        Contact form, details, map
├── privacy.html        Sample privacy policy
├── 404.html            Not-found page
├── css/styles.css      Whole design system (tokens → components → responsive)
├── js/
│   ├── config.js       ← the only file you must edit to receive form submissions
│   ├── main.js         Menu, scroll effects, counters, quick-track box
│   ├── forms.js        Validation + submission + quote estimator
│   └── tracking.js     Tracking demo logic
├── assets/
│   ├── img-src/        Original full-size images (inputs to the optimiser)
│   ├── img/            Optimised WebP + JPEG, 480/800/1200/1600 px (what the site loads)
│   └── icons/favicon.svg
├── tools/optimize_images.py
├── netlify.toml  sitemap.xml  robots.txt  .nojekyll  .gitignore
└── README.md
```

## 3. Run it locally

You need nothing installed except a browser.

**Option A — just open it:** double-click `index.html`.

**Option B — a local server (recommended, closer to real hosting):**
```bash
cd northbound-logistics
python -m http.server 8000      # Python 3
# then visit http://localhost:8000
```
or use the **Live Server** extension in VS Code (right-click `index.html` → *Open with Live Server*).

## 4. Customise it

1. **Business details** — search & replace in the `.html` files: `Northbound`, `+91 98765 43210`,
   `hello@northboundlogistics.in`, `Plot 14, Sector 62, Noida`.
2. **Colours & fonts** — edit the variables at the top of `css/styles.css` (`--navy-900`, `--yellow`, `--font-head`…).
3. **Social links** — footer links currently point at the networks' home pages; swap in your profiles.
4. **Images** — see below.
5. **Sample content** — testimonials, team and statistics are placeholders; replace them with real ones.

### Using your own photos (image optimisation)

```bash
pip install Pillow
# 1. copy your photos into assets/img-src/ (ideally >= 1200 px wide), named e.g. warehouse.jpg
# 2. run the optimiser from the project root
python tools/optimize_images.py
```
It writes `assets/img/<name>-480|800|1200|1600.webp` and `.jpg` and prints the size saved.
Pages reference them like this, so browsers download only the size they need:

```html
<picture>
  <source type="image/webp" srcset="assets/img/warehouse-480.webp 480w, assets/img/warehouse-800.webp 800w, assets/img/warehouse-1200.webp 1200w" sizes="(min-width: 980px) 560px, 92vw">
  <img src="assets/img/warehouse-1200.jpg" width="1200" height="900" alt="Describe the image" loading="lazy" decoding="async">
</picture>
```
Rules used throughout: always set `width`/`height`, `alt` text on every image, `loading="lazy"` below the fold,
and `loading="eager" fetchpriority="high"` for the hero only. Measured result for the home page: **~72 KB of images on
desktop, ~95 KB on a high-density phone** (all WebP).

## 5. Make the forms deliver messages

By default the forms run in **demo mode**: they validate, show the success screen and store a copy in the browser
(DevTools → Application → Local Storage → `nb_submissions`). To receive real submissions, edit `js/config.js`:

**Formspree (works on GitHub Pages *and* Netlify)**
1. Sign up at <https://formspree.io>, create a form, copy its URL (looks like `https://formspree.io/f/abcdwxyz`).
2. In `js/config.js` set:
   ```js
   FORM_MODE: "formspree",
   FORM_ENDPOINT: "https://formspree.io/f/abcdwxyz",
   ```

**Netlify Forms (Netlify only)**
1. In `js/config.js` set `FORM_MODE: "netlify"`.
2. Deploy to Netlify; submissions appear under *Site → Forms* (and can be emailed to you from *Form notifications*).

If sending fails, the visitor sees a friendly error with your phone number and their typed data is kept.

## 6. Deploy — GitHub Pages (free)

1. **Create the repository.** On GitHub click **New repository** → name it `northbound-logistics` → **Public** → *Create* (don't add a README).
2. **Push the code** from the project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Northbound Logistics website"
   git branch -M main
   git remote add origin https://github.com/sahil080805/northbound-logistics.git
   git push -u origin main
   ```
3. **Turn on Pages.** Repository → **Settings → Pages** → under *Build and deployment* choose **Deploy from a branch**,
   branch **main**, folder **/ (root)** → **Save**.
4. **Wait ~1 minute**, then open **https://sahil080805.github.io/northbound-logistics/** (the *Actions* tab shows progress).
5. **Update the URLs.** Canonical tags, `sitemap.xml` and `robots.txt` use that address. If your username or repo name differs,
   search & replace `https://sahil080805.github.io/northbound-logistics/` across the project, commit and push.

Updating later: edit → `git add . && git commit -m "Update" && git push` — the site redeploys automatically.

> **404 page note:** `404.html` includes a tiny script that fixes asset paths for project sites (`user.github.io/repo/`).
> If you use a root site (a repo named `<username>.github.io`), delete that first `<script>` in `404.html`.

## 7. Deploy — Netlify (free)

**Fastest (drag & drop):** open <https://app.netlify.com/drop> and drop the whole `northbound-logistics` folder.
You get a live `https://random-name.netlify.app` URL in seconds. Rename it under *Site configuration → Change site name*.

**Recommended (auto-deploys from GitHub):**
1. Push the repo to GitHub (steps 1–2 above).
2. Netlify → **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build command: *(leave empty)* · Publish directory: **`.`** (already set in `netlify.toml`) → **Deploy**.
4. Set `FORM_MODE: "netlify"` in `js/config.js` (or use Formspree) and push again.

## 8. Testing checklist (what was verified)

Automated browser tests (Chromium) passed for: empty / invalid / valid submission of both forms, error focus management,
honeypot, success state, server-failure state, estimate maths, `?service=` prefill, all four tracking states, invalid and
unknown IDs, `?id=` deep links, home quick-track redirect, animated counters, and the mobile menu (open, Escape, navigate).
Every page was also checked at **1440 px and 390 px** for console errors, broken images, broken internal links and
horizontal scrolling — none found.

Do a final manual pass after deploying: click every nav link, submit each form, resize the browser, and test on a real phone.

## 8b. Verify your live site (after deploying)

```bash
python tools/check_deployment.py https://sahil080805.github.io/northbound-logistics/
```
It checks every page, stylesheet, script and key image (HTTP 200 + correct content type), titles and meta descriptions,
that nothing points at `localhost`, and that a missing page returns a real 404. It exits non-zero if anything fails.

**Optional — deploy with GitHub Actions:** `.github/workflows/pages.yml` is included but inactive. To use it, set
*Settings → Pages → Source* to **GitHub Actions** and uncomment the `push:` trigger in that file.

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| Styles/images missing on GitHub Pages | Pages not enabled yet, or the site is still building (wait a minute, hard-refresh). Paths are relative, so keep the folder structure intact. |
| Form says it can't send | `FORM_MODE` is `formspree` but `FORM_ENDPOINT` is empty/wrong, or you're in `netlify` mode on GitHub Pages. |
| Changes not showing after push | Browser cache — hard refresh (Ctrl/Cmd+Shift+R); Pages can take up to a minute to rebuild. |
| Map is blank | The embedded OpenStreetMap needs internet access; use the *Open larger map* link. |
| Fonts look different offline | Poppins/Inter load from Google Fonts; offline the browser falls back to a system font. |
| `optimize_images.py` fails | `pip install Pillow` (Python 3.8+). |
