# Crap Productions — GitHub Pages starter

This version includes:

- Front page with large CRAP PRODUCTIONS header
- LATEST / NEWS featured image block
- Three large main menus: Catalog, Events / Notices, Contact
- Catalog page with two-column album covers
- Each cover links to Bandcamp
- Latest feature links directly to `catalog.html#crap009`
- Placeholder streaming buttons

## Upload to GitHub Pages

1. Create a new GitHub repository, for example `crap-productions`.
2. Upload all files in this folder to the repository root.
3. Go to `Settings > Pages`.
4. Set Source to `Deploy from a branch`.
5. Select `main` branch and `/root`.
6. Save.
7. The site will appear at:
   `https://YOUR-GITHUB-USERNAME.github.io/crap-productions/`

## Updating the latest image

In `index.html`, edit this part:

```html
<a class="latest-card" href="catalog.html#crap009">
  <img src="https://f4.bcbits.com/img/a2974466671_10.jpg" alt="Wholesome — Coil Breaks cover">
```

To feature another release:

1. Change the `href` to the release ID in `catalog.html`.
2. Change the image URL.
3. Change the title text.

## Adding streaming links

In `catalog.html`, find:

```html
<a href="#" class="disabled" aria-disabled="true">Streaming</a>
```

Replace it with:

```html
<a href="YOUR_STREAMING_LINK" target="_blank" rel="noopener">Streaming</a>
```

and remove `class="disabled" aria-disabled="true"`.
