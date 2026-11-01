# abbydavid.com

A plain static site: HTML and CSS, no JavaScript, no build step.

```
index.html      homepage
404.html        "not found" page (GitHub Pages serves it automatically)
styles.css      all styling; colors and fonts are at the top
CNAME           tells GitHub Pages to use abbydavid.com
assets/         favicon, social image
```

## Editing content

Open `index.html` in a text editor. Comments (`<!-- ... -->`) mark what to change.

- **Project cards:** copy a `<li class="card">` block. Change the label (PROJECT, TOOL, RECIPE, GUIDE, TRAVEL, EXPERIMENT), title, text, and link. The card links currently point to `/projects/#...` pages that don't exist yet; replace them with real links when you have projects.
- **Notes:** replace the "Coming soon" paragraph with `<li class="note">` items (an example is in the comment in `index.html`).
- **GitHub link:** in the footer, replace `YOUR-GITHUB-USERNAME` with your GitHub name.
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
   - a `CNAME` record for `www` pointing to `YOUR-GITHUB-USERNAME.github.io`

   (Check GitHub's "Managing a custom domain" docs in case these have changed.)

Changes go live a minute or so after each commit.

To preview locally: `python3 -m http.server` in this folder, then open http://localhost:8000.
