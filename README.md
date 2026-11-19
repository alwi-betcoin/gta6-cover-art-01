[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/alwi-betcoin/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/alwi-betcoin/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Palmwave Cover Studio

An entry for make.fun's [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty.

Palmwave Cover Studio turns a person's own photo and a caption into GTA-style cover art: a
multi-panel poster collage with slanted panels, a Vice City colour grade and bold poster lettering,
exported as a PNG ready to post. It is a static web app — no build step, no uploads, no network:
your photos are read on your own machine and never leave it.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. (Any static file server pointed at `app/`
works just as well.)

## What it does

- **Photos** — add your own photos from disk, or start from the six built-in samples (made with an
  image model, free to use). Click a panel on the cover to select it, click a photo to put it
  there, drag to reposition the photo inside its panel, scroll or use the slider to zoom. Wide
  panels anchor their crop toward the top of the photo so faces stay in frame.
- **Fill modes** — *A photo per panel* gives every panel its own photo; *One photo, all panels*
  spreads a single photo continuously across the whole collage.
- **Seven layouts** — Hero (full-bleed with a slashed second panel and the title in the sky),
  Triptych, Cover Story, Shards, Skyline, Fan and Quad: slanted, GTA-style panel collages with
  dark-and-light keylines between the panels.
- **Five colour grades** — Vice Sunset, Neon Night, Gold Hour, Candy Pop and Chrome Mono. Each
  grade posterizes the photo toward the illustrated poster look and split-tones it gently, so
  skin tones stay plausible.
- **Captions** — an editable title and a smaller line, set in Anton and Archivo Black (both
  shipped under `app/fonts/` under the SIL Open Font License), with an accent offset shadow and
  letterspaced subline. No Rockstar logos, artwork or fonts anywhere — everything is original.
- **Export** — one click renders the cover at full size and downloads a PNG:
  1080 × 1080 (square), 1080 × 1350 (portrait) or 1920 × 1080 (wide).

## Handing it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json`
with the vendored `buildDossier` from `vendor/makefun-app.ts` (the kit's library, unchanged).

The screenshots in `screenshots/` are the studio's own work: three exported covers (wide, portrait
and square) and the editor with a photo loaded, produced by driving the app through the scenes in
`shots.json` — each cover is the PNG the app exported, scaled down to the hand-in limits.

## License

MIT (see `LICENSE`). The fonts under `app/fonts/` are licensed separately under the SIL Open
Font License 1.1 (see the `*-OFL.txt` files beside them).
