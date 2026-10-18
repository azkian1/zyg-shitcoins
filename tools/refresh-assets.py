"""Refresh metadata/cache versions and previews from the current edited PNGs.

Never regenerates or writes an atlas. Run after editing assets/fighter-atlas-*.png.
Requires Pillow; Python standard library handles everything else.
Generated previews and reports go to ../work/qa/assets/.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime, timezone
import hashlib
import json
import math
import re

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
QA_ASSETS = ROOT.parent / 'work' / 'qa' / 'assets'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    QA_ASSETS.mkdir(parents=True, exist_ok=True)
    manifest_path = ASSETS / 'motions.js'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8').split('=', 1)[1].strip().rstrip(';'))
    atlas_images = []
    before_hashes = {}
    for atlas in manifest['atlases']:
        relative = atlas['src'].split('?', 1)[0]
        path = ROOT / relative
        sha = digest(path)
        before_hashes[relative] = sha
        image = Image.open(path)
        if image.mode != 'RGBA':
            raise ValueError(f'{relative}: expected RGBA, got {image.mode}')
        expected = (atlas['columns'] * manifest['tileWidth'], atlas['rows'] * manifest['tileHeight'])
        if image.size != expected:
            raise ValueError(f'{relative}: {image.size} differs from {expected}')
        atlas_images.append(image.copy())
        atlas['sha256'] = sha
        atlas['src'] = relative + '?v=' + sha[:16]
    revision = hashlib.sha256(''.join(before_hashes.values()).encode()).hexdigest()[:16]
    manifest.update(version=3, assetRevision=revision, manuallyEdited=True)
    tiles = []
    for frame in manifest['frames']:
        x, y, w, h = (frame[key] for key in ['x', 'y', 'w', 'h'])
        tile = atlas_images[frame['atlas']].crop((x, y, x + w, y + h))
        alpha = tile.getchannel('A')
        histogram = alpha.histogram()
        frame.update(alphaPixels=sum(histogram[1:]), bbox=alpha.getbbox())
        if frame['bbox'] is None:
            raise ValueError(f"Empty edited frame {frame['sourceFrame']}")
        tiles.append(tile)
    manifest_path.write_text('window.ZYG_FIGHTER_ASSETS = ' + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    html_path = ROOT / 'index.html'
    html = html_path.read_text(encoding='utf-8')
    for relative in ['assets/motions.js', 'fighter.js']:
        version = digest(ROOT / relative)[:16]
        html = re.sub(r'(src=")' + re.escape(relative) + r'(?:\?[^"\s]*)?(")',
                      lambda m: m[1] + relative + '?v=' + version + m[2], html)
    html_path.write_text(html, encoding='utf-8')
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 16)
    contact = Image.new('RGB', (9 * 144, math.ceil(len(tiles) / 9) * 170), '#1f2331')
    draw = ImageDraw.Draw(contact)
    for i, tile in enumerate(tiles):
        x, y = i % 9 * 144, i // 9 * 170
        small = tile.resize((144, 144), Image.Resampling.LANCZOS)
        contact.paste(small, (x, y), small)
        draw.text((x + 5, y + 145), f"{i}: src{manifest['frames'][i]['sourceFrame']}", font=font, fill='white')
    contact.save(QA_ASSETS / 'motion-all-tiles.png')
    summary = Image.new('RGB', (8 * 144, len(manifest['motions']) * 182), '#1c1f2a')
    summary_draw = ImageDraw.Draw(summary)
    for row, (name, motion) in enumerate(manifest['motions'].items()):
        sequence = motion['frames']
        columns = 8
        preview = Image.new('RGB', (columns * 160, math.ceil(len(sequence) / columns) * 184), '#272b39')
        preview_draw = ImageDraw.Draw(preview)
        for index, frame_id in enumerate(sequence):
            x, y = index % columns * 160, index // columns * 184
            small = tiles[frame_id].resize((160, 160), Image.Resampling.LANCZOS)
            preview.paste(small, (x, y), small)
            active = any(a <= index <= b for a, b in motion.get('impactWindows', []))
            preview_draw.text((x + 5, y + 160), f"{index}: src {manifest['frames'][frame_id]['sourceFrame']}",
                              font=font, fill='#ffe892' if active else '#c4cbd9')
        preview.save(QA_ASSETS / f'motion-preview-{name}.png')
        summary_draw.text((8, row * 182 + 3), f"{name} / {len(sequence)} frames / {motion['fps']}fps", font=font, fill='white')
        for column in range(8):
            index = round(column * (len(sequence) - 1) / 7)
            small = tiles[sequence[index]].resize((144, 144), Image.Resampling.LANCZOS)
            summary.paste(small, (column * 144, row * 182 + 26), small)
        playback = sequence + sequence[-2:0:-1] if motion.get('pingpong') else sequence
        animation = []
        for frame_id in playback:
            frame = Image.new('RGB', (240, 240), '#272b39')
            small = tiles[frame_id].resize((240, 240), Image.Resampling.LANCZOS)
            frame.paste(small, (0, 0), small)
            animation.append(frame)
        animation[0].save(QA_ASSETS / f'motion-{name}.gif', save_all=True, append_images=animation[1:],
                          duration=round(1000 / motion['fps']), loop=0, optimize=True)
    summary.save(QA_ASSETS / 'motion-summary.png')
    for relative, sha in before_hashes.items():
        if digest(ROOT / relative) != sha:
            raise RuntimeError('Atlas bytes changed during refresh: ' + relative)
    report = dict(updatedAt=datetime.now(timezone.utc).isoformat(), revision=revision,
                  atlasHashes=before_hashes, atlasFilesUnchanged=True, frameCount=len(tiles),
                  cacheVersions=True, manuallyEdited=True)
    (QA_ASSETS / 'edited-assets-refresh.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
