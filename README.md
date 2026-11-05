# abbydavid.com

A plain static site: HTML and CSS, no build step. The only JavaScript is the pet toy on /pets/ and a tiny light/dark switch (`theme.js`).

```
index.html      homepage (a curated selection)
projects/       full project archive (/projects/)
pets/           the little pet toy (/pets/): index.html + pets.js
404.html        "not found" page (GitHub Pages serves it automatically)
styles.css      all styling; colors and fonts are at the top
theme.js        the light/dark switch (remembers the choice in localStorage)
CNAME           tells GitHub Pages to use abbydavid.com
assets/         favicon, social image, fonts/, pets/
```

## Editing content

Open `index.html` in a text editor. Comments (`<!-- ... -->`) mark what to change.

- **Spotlight projects:** the homepage shows a few big `<article class="work">` blocks (text + screenshot). Copy one, change the details, and add `flip` to the class to put the picture on the left. Keep the homepage to your favorites; add everything (including the featured ones) to `projects/index.html` as `<li class="entry">` items. Types: TOOL, EXPERIMENT, PROJECT, GUIDE, RECIPE, BUILD, TRIP. Screenshots go in `assets/` (WebP or PNG, about 1000px wide). Give each a numbered `<figcaption>` (Fig. 1, Fig. 2, ...).
- **Status dot:** `<span class="status">` is a filled dot (live/done); `<span class="status concept">` is hollow (idea).
- **Notes:** the Notes section is hidden until there is a real note. The ready-to-use markup is in a comment in `index.html`; uncomment it and add a "Notes" link to the nav.
- **Pets (`/pets/`):** a small shared room with Jack, Albert, Elda and Svetlana. Names, kinds and notes are in the `PETS` list at the top of `pets/pets.js`. Sprites are 8-frame SVG sheets in `assets/pets/<name>.svg` (row 0 faces right, row 1 faces left). To show a real photo in the side panel, upload it to `assets/pets/photos/` (for example `jack.jpg`, resized to ~800px wide) and set that pet's `photo` field. Room colors and layout live in `pets/pets.css`.
- **Weather:** the room window shows current St. Louis weather from [Open-Meteo](https://open-meteo.com/) (CC BY 4.0, no key, no geolocation). It is cached for 30 minutes in the visitor's browser; if it fails, a default room is shown. Time of day uses St. Louis time; small seasonal details use the visitor's date.
- **Saved data:** hearts, scrapbook finds and the selected pet stay in the visitor's own browser (localStorage, key `abbydavid-pets-v1`; weather cache `abbydavid-weather-v1`). Nothing is sent anywhere, and the page has a Reset button. There is no sound.
- **Footer date:** "Updated Nov 2026" is typed by hand. Change it when you update the site.
- **Colors/fonts:** edit the tokens at the top of `styles.css`. Light values are in `:root`; dark values appear twice (once for `prefers-color-scheme`, once for `[data-theme="dark"]`), so change both.
- **Light/dark:** follows the system setting; the header switch overrides it and saves the choice (`abbydavid-theme`). A short inline script in each page's `<head>` applies a saved choice before first paint. New pages need that script, the `theme-toggle` button in the nav, and `<script src="/theme.js" defer>`. The pet room keeps its own St. Louis time/weather lighting regardless of the site theme.

## Fonts and credits

Self-hosted (no requests to font CDNs), all under the SIL Open Font License 1.1; license texts are in `assets/fonts/`. Files are the Latin subsets from [Fontsource](https://fontsource.org/) packages (`@fontsource-variable/newsreader`, `@fontsource-variable/atkinson-hyperlegible-next`, `@fontsource/ibm-plex-mono`, v5.3.0).

- **Newsreader** (Production Type): headings, lead text, captions. [github.com/productiontype/Newsreader](https://github.com/productiontype/Newsreader)
- **Atkinson Hyperlegible Next** (Braille Institute): body and interface text, chosen for legibility. [github.com/googlefonts/atkinson-hyperlegible-next](https://github.com/googlefonts/atkinson-hyperlegible-next)
- **IBM Plex Mono** (IBM): small metadata only (catalogue numbers, dates, captions). [github.com/IBM/plex](https://github.com/IBM/plex)

## Images

- `assets/ecotox-id.webp`, `assets/at-fitness-tracker.webp`: screenshots of our own projects (the AT Fitness Tracker one is its pixel-art camp scene).
- The framed specimen in the pet room is an original line drawing made for this site (CSS). No third-party images are used, so there is nothing to attribute. If you add one (for example a macro photo from Wikimedia Commons), record the creator, source URL and license here, and don't hotlink it.

## Placeholders still to replace

- `assets/og-image.png`: a 1200×630 image shown when the site is shared.
- `assets/apple-touch-icon.png`: a 180×180 icon for iPhones.
- `assets/favicon.svg`: a simple placeholder icon; swap in your own.

## Adding pages later

Create a folder with its own `index.html`; the folder name becomes the URL:

```
projects/index.html  ->  abbydavid.com/projects/
notes/index.html     ->  abbydavid.com/notes/
about/index.html     ->  abbydavid.com/about/
notes/my-post/index.html -> abbydavid.com/notes/my-post/
```

Copy `index.html` as a starting point and change the `<title>`, `description`, `canonical`, and `og:*` tags so each page has its own sharing info. For post text, wrap it in `<article class="prose">`. If a guide ever includes affiliate links, put a `<p class="disclosure">` near the top saying so.

Subdomains (e.g. `lab.abbydavid.com`) can later be separate GitHub repos with their own Pages settings and DNS records; nothing here needs to change.

## Publishing with GitHub Pages

1. Create a GitHub repository and upload these files to the root of the `main` branch.
2. In the repo go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Under **Custom domain**, enter `abbydavid.com` and save (the `CNAME` file already does this). Tick **Enforce HTTPS** once available.
4. At your domain registrar, add DNS records:
   - `A` records for `abbydavid.com` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - a `CNAME` record for `www` pointing to `revDWD.github.io`

   (Check GitHub's "Managing a custom domain" docs in case these have changed.)

Changes go live a minute or so after each commit.

To preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
