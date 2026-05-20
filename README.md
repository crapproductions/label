# Crap Productions GitHub Pages — layout v2

This is the cleaner left-navigation version based on the supplied mockups.

## Pages

- `index.html` — home page with one large latest/news image. It links to `catalogue.html#crap009`.
- `catalogue.html` — large two-column album covers. Small links under each cover.
- `report.html` — Instagram-like visual report grid. Current layout uses 4:3 images, 3 per row on desktop.
- `contact.html` — contact links.
- `style.css` — all styling.

## Upload

Upload the files directly to the root of the GitHub repository:

- index.html
- catalogue.html
- report.html
- contact.html
- style.css
- assets/

Do not upload the zip itself.

## Report images

Replace these files with your own iPhone 4:3 photos:

assets/reports/report-001.jpg
assets/reports/report-002.jpg
...

Keep the same filenames if you do not want to edit HTML.

## Catalogue links

The `LISTEN` buttons are placeholders. You can use them for:

1. Bandcamp album page
2. Spotify / Apple Music
3. A separate listen page
4. A Bandcamp embed block below the cover

For now the page stays visually clean.


## v3 change

Left fixed menu has been enlarged to match the supplied mockup proportions. Upload `style.css` to overwrite the previous layout, or upload the full folder.


## v5 main fix

Latest image enlarged to `min(1040px, 92%)`; left fixed menu pushed lower with larger logo/title/menu.

## v6 logo and square latest-cover fix

- Left logo block now uses one combined image: `assets/ui/logo.png`.
- Replace `assets/ui/logo.png` with your own image that already contains the mark and CRAP PRODUCTIONS type.
- Home latest release image is now forced to a square album-cover frame.

## v7 final notes

This package combines:
- One-image left logo block: `assets/ui/logo.png`
- Crooked / uneven menu alignment
- Square latest-release image on the home page
- Two-column catalogue page
- 4:3 report grid


## v8 main match
- Logo image display width increased to 444px.
- Left block pushed lower.
- Home latest square cover max size increased to 920px.


## v10 report/menu update
- Report grid changed to portrait tiles (3:4) and 4 columns on desktop.
- Report page now has click-to-enlarge lightbox without leaving the page.
- Left navigation made smaller and more crooked like the original MAIN mockup.
- Logo display size increased again.


## v11 final tweak
- Report grid: 3 columns, 4:3 landscape tiles.
- Side menu: smaller and crooked to match the MAIN reference more closely.
- Logo display size increased again.
- Report lightbox kept intact.


## v12 tweaks
- Side menu alignment adjusted closer to provided reference.
- Side menu size reduced slightly.
- Logo display enlarged slightly again.
- Report grid is 3 across in 4:3.
- Report item order changed so 001 starts downward by columns: 001,005,009 / 002,006,010 ...


## v13 correction

Report visual order:

12 / 11 / 10
9  / 8  / 7
6  / 5  / 4
3  / 2  / 1

Report frame is vertical-standing. In CSS, vertical frame is `aspect-ratio: 3 / 4` because CSS uses width / height.


## v14 final left panel / report correction

Left panel follows the supplied reference: one large logo block and centered menu block.
Report order is:
12 / 11 / 10
9  / 8  / 7
6  / 5  / 4
3  / 2  / 1

Report tiles are vertical long frames: aspect-ratio 3 / 4.
Lightbox remains active.


## v15 actual fix
Left panel is now centered and uses the uploaded logo image as a single block.
Report order and 3-column vertical tile frame corrected.
