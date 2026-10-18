# Zygote vs Shitcoins

This directory is the only maintained game and the Git repository root. Its static files are served directly by GitHub Pages; no build or staging copy is needed. Read `README.md` for gameplay and `project.md` for architecture and maintenance.

## Workspace

All local game work belongs inside `D:/Jul/ZYG`. Run shell commands from `D:/Jul/ZYG/fighter` or a relevant workspace subdirectory. Never create or modify game files, assets, copies, tests, logs or task artifacts in `D:/VibeCemetery/vibecemetery`.

Keep one playable copy in `fighter/`. Temporary QA reports, screenshots, previews and browser data belong in `D:/Jul/ZYG/work/qa/`, outside this repository. Do not recreate the removed movement demo, source-extraction archive or release staging site.

## Preserve manual art

`assets/fighter-atlas-*.png` contain the user's manual cleanup and are authoritative. Preserve them. Never regenerate these atlases from source video or rerun historical extraction/repair scripts without an explicit user request.

After an intentional atlas edit, run `python tools/refresh-assets.py` to update metadata, cache versions and inspection previews while preserving atlas bytes. Keep the local font license texts in `assets/fonts/`.

## Verification

Serve locally with `node tools/serve.mjs` at `http://127.0.0.1:8798/`.

Check changed behavior in the browser: desktop/touch controls, all three languages, mobile layout and audio. Confirm that atlas hashes remain unchanged unless an art edit was explicitly requested. Update documentation when behavior or workflow changes, then remove temporary QA and test files.
