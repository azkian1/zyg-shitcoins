# Zygote vs Shitcoins — project map

## 1. Workspace and playable versions

All game work belongs in `D:/Jul/ZYG`. Keep game files and working copies within this workspace; use `work/` for intermediate artifacts, screenshots and logs. `AGENTS.md` contains the authoritative workspace rules.

| Workspace path | Purpose |
| --- | --- |
| `fighter/` | Active kung-fu arcade game; local URL `http://127.0.0.1:8798/`. |
| `game/` | Original movement demo, with its own HTML, JavaScript, CSS, source sprites and asset manifest; local port `8797`. |
| `work/` | Intermediate files, extraction dependencies, browser screenshots, test reports and archived working copies. |
| `dropstab-logos-30-100/` | Source coin metadata and PNG logos imported into the fighter. |
| `project.md` | This implementation map. `fighter/README.md` is the player-facing English guide. |

## 2. Runtime entry points

`fighter/index.html` defines the masthead, language buttons, canvas, HUD, menu/loss overlay, portfolio slots and keyboard/touch controls. Its deferred script order is significant:

1. `assets/motions.js` exposes `window.ZYG_FIGHTER_ASSETS`.
2. `assets/shitcoins.js` exposes `window.ZYG_SHITCOINS`.
3. `music-loop.js` exposes `ZYGMusicLoop`.
4. `i18n.js` exposes `ZYG_I18N` and translates the static DOM.
5. `fighter.js` creates the simulation, loads assets, attaches input and starts rendering.

`fighter/styles.css` owns the forest arcade presentation, local font declarations, custom SVG icon treatment, score/combo/Break states, menu/loss layouts, mobile controls and reduced-motion rules. Inline SVG markup and `assets/zygote-mark.svg` provide custom icons.

## 3. Game model: `fighter/fighter.js`

`motionSpecs(manifest)` combines move defaults with manifest frame counts, FPS and impact windows. `FighterSimulation` is independent of the DOM and is exported through `module.exports` for engine tests.

| Simulation member | Responsibility |
| --- | --- |
| `reset()`, `start()`, `setPaused()` | Round state, clean portfolio/charge, phase changes and pause state. |
| `action(move, side, queue)` | Validate attacks, require full Break charge, set facing and queue an attack during recovery. |
| `spawn()`, `spawnWave()` | Create individually identified coins with logo variants, type, random size and clockwise spin. |
| `flowSpeed()`, `emissionInterval()` | Increase difficulty while keeping the incoming stream spaced. |
| `update(dt)` | Advance movement and attack windows, resolve correct attack types, award points/charge, register missed coins and end the round. |
| `emit()`, `snapshot()` | Emit semantic events and expose a copy of observable gameplay state. |
| `multiplier`, `comboTier`, `comboTitle`, `breakReady` | Derived score multiplier, 10/25/50-hit milestones, model milestone title and full-charge readiness. The browser translates titles from `combo.<tier>` keys. |

Small coins require punch/palm attacks; red heavy coins require kick/jump-kick attacks. Perfect timing is based on distance to the target position. A normal hit adds 9% Break charge; a perfect hit adds 16%. Break spends all charge and can hit both sides without charging itself.

The perfect-hit callout is `NO FOMO` in every language. The 25-hit title expresses resisting the shill and is translated with the rest of the interface.

Each missed wave adds its actual coin to `sim.portfolio` in arrival order. Three coins end the round. The same variants feed the HUD and loss-screen portfolio; restarting resets both.

## 4. Browser controller and presentation

- `requestMove()` connects keyboard and pointer input to `sim.action()`.
- `start()` and `pause()` coordinate round state, overlays, effects and audio.
- `consumeEvents()` turns simulation events into hit stops, flashes, particles, reflected coins, capture animations, semantic callouts, combo accents and sound.
- `updateHUD()` translates and updates score, combo, charge, action help, portfolio ARIA labels and menu/loss text. `updateGameoverPortfolio()` builds the three loss-screen logos from the real portfolio and updates their localized accessibility labels without recreating unchanged images.
- `getMotionFrame()` chooses neutral/attack/recovery sprite frames; `drawCharacter()` mirrors attacks for the selected side.
- `drawBackground()`, `drawPlatform()`, `drawHitZones()`, `drawShitcoin()`, `drawTelegraphs()`, `drawImpacts()` and `drawCaptures()` draw the arena and effects.
- `render(dt)` draws a frame. `tick(timestamp)` advances the simulation in fixed steps, honors contact freezes and schedules the next animation frame.
- `ready` waits for required sprite atlases and coin logos; asset failures remain visible in the interface.

The main flow is **input → simulation → semantic events → effects/audio/HUD → canvas**. Dynamic messages store translation keys and parameters so changing language also updates messages already on screen.

The loss overlay uses `#gameover-portfolio` for the three purchased logos, `#gameover-bagholder` for its caption, `#gameover-score` for the score and `#gameover-question` for the retry prompt. `#restart-button` starts a clean round. The shared `#overlay-title` identifies the loss state; `#overlay-copy` serves other menu phases.

`window.ZYG_FIGHTER` exposes `ready` and a read-only `state` snapshot. With `?test=1` only, `.test` exposes `start`, `clear`, `spawn`, `action`, `advance`, `pause` and `setElapsed` for deterministic QA. These helpers exercise the real simulation; they are absent from normal play.

## 5. Controls and saved state

| Move | Left side | Right side |
| --- | --- | --- |
| Jump kick | W | I |
| Punch | A | J |
| Kick | S | K |
| Palm strike | D | L |

Space casts charged Break; Enter starts/resumes; Esc pauses/resumes; M toggles sound. Keys use `KeyboardEvent.code`, so physical positions work with non-English layouts. On-screen attack buttons support pointer/touch input. Enter and Space on a focused language button select that language without triggering combat.

Local storage keeps the best score in `zyg-junkfu-best`, mute preference in `zyg-junkfu-muted` and selected language in `zygote-language`. There is no server-side score service.

## 6. Languages: `fighter/i18n.js`

The dictionary contains Russian (`ru`), English (`en`) and Simplified Chinese (`zh`). `initialLanguage()` checks a supported `?lang=` parameter, saved preference and browser language, then falls back to English. HTML language is `zh-Hans` for Chinese.

`ZYG_I18N.t(key, params)` interpolates messages; `applyDOM()` handles `data-i18n`, translated title/ARIA attributes and pressed language buttons. `setLanguage()` saves the selection, updates the URL and dispatches `zygote:languagechange`. The fighter listener refreshes the HUD and redraws without resetting gameplay or audio. Numbers use locale-aware formatting in the fighter's `number()` helper.

## 7. Assets and preservation rules

- `assets/fighter-atlas-*.png`: four authoritative, manually cleaned transparent atlases. **Preserve these files. Never rebuild them from source video without an explicit request.**
- `assets/motions.js`: atlas paths/hashes, tile coordinates, source-frame references, move sequences, FPS and contact windows for 85 character frames.
- `assets/motion-preview-*.png` and `fighter/review/`: existing animation previews and earlier inspection material; they are not runtime dependencies.
- `assets/shitcoins/*.png`: imported coin logos. `assets/shitcoins.js` records their paths, names, symbols and visible bounds. Circular clipping happens in the canvas renderer.
- `assets/arena-bg.webp`: forest backdrop. `assets/arena-prompt.txt` records its generation provenance.
- `assets/fonts/`: bundled Russo One and Golos Text files and SIL Open Font License texts. Chinese uses the configured system-font fallback.
- `assets/music-loop.wav`: processed looping soundtrack. `work/audio-loop/music-loop-original.wav` is the preserved source used by the preparation tool.

After an intentional atlas edit, run `python fighter/tools/refresh-assets.py`. It reads the current PNGs, updates hashes/cache versions and previews, and verifies that atlas bytes remain unchanged. `prepare-fighter.py` is the historical extraction/build path and protects manually edited atlases; do not use its destructive rebuild option without explicit authorization.

## 8. Music and generated sound

`fighter/music-loop.js` contains `ZYGMusicLoop`. `play()` fetches/decodes the WAV once, starts a continuously looping Web Audio buffer and handles volume/mute gain. `pause()` preserves playback position. `_playFallback()` uses HTML Audio for direct file opening or failed Web Audio loading; epoch checks prevent stale asynchronous playback from restarting paused music.

`tools/prepare-music-loop.py` creates the circular PCM track from the preserved original, with a smooth, correlation-compensated overlap of about 1.67 seconds. Do not repeatedly process the already blended output.

The fighter's `tone()`, `noise()`, `sound()`, `coinSound()` and `comboAccent()` synthesize attack, impact, coin and milestone sounds with Web Audio. `unlockAudio()` starts/resumes the audio context after player interaction.

## 9. Local tools and verification

Run commands from `D:/Jul/ZYG`:

```text
node fighter/tools/serve.mjs
node --test fighter/tools/fighter-engine-test.mjs
node --test fighter/tools/music-loop-test.mjs
node fighter/tools/playtest-wow.mjs
node fighter/tools/playtest-i18n.mjs
node fighter/tools/playtest-music-loop.mjs
python fighter/tools/package-pages.py
```

`serve.mjs` serves `fighter/` at `127.0.0.1:8798` (`ZYG_PORT` overrides the port). `browser-runtime.mjs` locates Playwright; browser scripts use the installed Chromium executable. Engine tests verify simulation rules; music tests cover playback state and rendered loop continuity. WOW browser tests cover physical controls, hit stops, Break, milestones, portfolio and mobile play. The language suite covers actual language buttons, persistence, keyboard behavior, live-state preservation and translated desktop/mobile loss screens.

`ZYG_TEST_URL` points WOW/language browser tests at a local or published site. `ZYG_TEST_OUTPUT` redirects their reports/screenshots to a directory under `work/`. `ZYG_SCREENSHOT_VERIFY_ONLY=1` prevents the language suite from replacing the canonical English README screenshot. Keep browser temporary profiles, screenshots and reports in `work/`.

`playtest-fighter.mjs`, `playtest-shitcoins.mjs` and `stream-assets-browser.mjs` retain earlier focused browser checks. `import-shitcoins.py` imports source logos and writes their manifest. Python asset tools require their documented imaging dependencies; the playable static site does not.

## 10. Publishing

Public game: `https://azkian1.github.io/zyg-shitcoins/`. Repository: `https://github.com/azkian1/zyg-shitcoins`.

`fighter/tools/package-pages.py` stages a release in `work/circle-pages/site/` and writes `work/circle-pages/package-manifest.json` with file sizes and SHA-256 hashes. It **flattens `fighter/` into the GitHub repository root**: local `fighter/index.html` becomes published `index.html`; local `fighter/assets/` becomes published `assets/`. Preserve relative runtime URLs.

The package includes runtime scripts/styles/assets, English `README.md`, this map and `.nojekyll`. The canonical screenshot stays at `work/i18n-patch/browser/gameplay-en.png` locally and is published as `docs/screenshots/gameplay-en.png` for the README. Tools, raw video, intermediate files and the original movement demo are not required by the deployed game.

Before publishing, finalize script/style cache hashes, run the relevant engine/browser checks, stage the package and publish the staged files. Verify the deployed title, languages, README image and mobile controls on GitHub Pages; use verify-only screenshot mode for public QA.
