# Zygote vs Shitcoins — project map

This is the only maintained game and the Git repository root. It is a static browser app: GitHub Pages serves these files directly, with no build step, backend or release staging copy.

- [Repository](https://github.com/azkian1/zyg-shitcoins)
- [Public game](https://azkian1.github.io/zyg-shitcoins/)
- [Player guide](README.md)
- [Workspace and maintenance rules](AGENTS.md)

## Source map

| File | Responsibility |
| --- | --- |
| `index.html` | Canvas, HUD, portfolio, menus, language and attack buttons |
| `styles.css` | Layout, presentation, fonts and responsive/reduced-motion rules |
| `fighter.js` | Simulation, input, canvas rendering, HUD, effects and synthesized sounds |
| `i18n.js` | Russian, English and Simplified Chinese text and language switching |
| `music-loop.js` | Looping music, pause/resume and HTML Audio fallback |
| `assets/motions.js` | Sprite frames, animation timing and atlas metadata |
| `assets/shitcoins.js` | Coin logo manifest |
| `tools/` | Local server and atlas metadata/preview refresh |

Deferred scripts load in dependency order: motion manifest, coin manifest, music, translation, then the game controller. Keep this order when editing `index.html`.

Runtime assets include the four fighter atlases, coin logos, arena background, music, SVG mark and bundled fonts. Keep the SIL Open Font License texts in `assets/fonts/`. `docs/screenshots/gameplay-en.png` is the player-guide image.

## Game structure

`FighterSimulation` owns combat, score, combo, Break charge, portfolio and difficulty. The browser controller advances it at fixed `1/120`-second steps, consumes its events and updates presentation. Contact freezes temporarily stop progression.

Attack durations and contact windows come from the motion manifest. Every strike returns through neutral. At one life, guard entry/exit animations preserve the next attack's existing contact timing.

Gameplay rules and controls belong in [README.md](README.md). Keep those descriptions aligned with the simulation when changing attacks, scoring, charge or stop loss. Language changes update the interface and URL without restarting the round. Best score, mute preference and language are saved locally in the browser.

## Asset maintenance

`assets/fighter-atlas-*.png` contain the user's manual cleanup and are authoritative. Preserve their bytes unless the user explicitly requests an atlas edit. Never regenerate them from source video or rerun historical extraction/repair scripts.

After an intentional atlas edit, run:

```text
python tools/refresh-assets.py
```

This requires Pillow. It refreshes manifest measurements/hashes and HTML cache versions, writes inspection previews to the QA workspace and verifies that atlas bytes did not change.

When changing other runtime scripts or styles, update their `?v=` cache versions in `index.html` before publishing. The atlas tool updates only the motion-manifest and fighter-script references.

## Local development

Run from `D:/Jul/ZYG/fighter/`:

```text
node tools/serve.mjs
```

Open [127.0.0.1:8798](http://127.0.0.1:8798/). `ZYG_PORT` overrides the port. Directly opening `index.html` also works; no dependency installation is needed to play.

Check the changed behavior in the browser, including controls, all three languages, mobile layout and audio. Temporary reports, previews, screenshots and browser data belong in `D:/Jul/ZYG/work/qa/`, outside this repository. Remove disposable output when finished.

## Publishing

Review the diff, verify the changed behavior, commit the intended files and push to the existing GitHub Pages repository. Keep relative asset URLs and one playable copy. After deployment, check loading, languages, desktop/mobile controls and audio.
