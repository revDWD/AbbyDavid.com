# abbydavid.com

A plain static site: HTML and CSS, no build step. The only JavaScript is the small pet toy on /pets/.

```
index.html      homepage (a curated selection)
projects/       full project archive (/projects/)
pets/           the little pet toy (/pets/): index.html + pets.js
404.html        "not found" page (GitHub Pages serves it automatically)
styles.css      all styling; colors and fonts are at the top
CNAME           tells GitHub Pages to use abbydavid.com
assets/         favicon, social image
```

## Editing content

Open `index.html` in a text editor. Comments (`<!-- ... -->`) mark what to change.

- **Featured projects:** the homepage shows a few big `<article class="work">` blocks (text + screenshot). Copy one, change the details, and add `flip` to the class to put the picture on the left. Keep the homepage to your favorites; add everything (including the featured ones) to `projects/index.html` as `<li class="entry">` items. Types: TOOL, EXPERIMENT, PROJECT, GUIDE, RECIPE, BUILD, TRIP. Screenshots go in `assets/` (WebP or PNG, about 1000px wide).
- **Status dot:** `<span class="status">` is a filled dot (live/done); `<span class="status concept">` is hollow (idea).
- **Notes:** the Notes section is hidden until there is a real note. The ready-to-use markup is in a comment in `index.html`; uncomment it and add a "Notes" link to the nav.
- **Pets (`/pets/`):** a small shared room with Jack, Albert, Elda and Svetlana. Names, kinds and notes are in the `PETS` list at the top of `pets/pets.js`. Sprites are 8-frame SVG sheets in `assets/pets/<name>.svg` (row 0 faces right, row 1 faces left). To show a real photo in the side panel, upload it to `assets/pets/photos/` (for example `jack.jpg`, resized to ~800px wide) and set that pet's `photo` field. Room colors and layout live in `pets/pets.css`.
- **Weather:** the room window shows current St. Louis weather from [Open-Meteo](https://open-meteo.com/) (CC BY 4.0, no key, no geolocation). It is cached for 30 minutes in the visitor's browser; if it fails, a default room is shown. Time of day uses St. Louis time; small seasonal details use the visitor's date.
- **Saved data:** hearts, scrapbook finds and the selected pet stay in the visitor's own browser (localStorage, key `abbydavid-pets-v1`; weather cache `abbydavid-weather-v1`). Nothing is sent anywhere, and the page has a Reset button. There is no sound.
- **Footer date:** "Updated Nov 2026" is typed by hand. Change it when you update the site.
- **Colors/fonts:** edit the `:root` block at the top of `styles.css`.

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
