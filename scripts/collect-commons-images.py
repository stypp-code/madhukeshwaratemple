"""Audit and collect openly licensed photographs from Wikimedia Commons."""
from __future__ import annotations

import argparse
import html
import json
import random
import re
import shutil
import time
import unicodedata
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "MadhukeshwaraTempleImageAudit/1.0 (heritage photo inventory)"
CATEGORIES = [
    "Category:Madhukesvara Temple, Banavasi",
    "Category:Nandi at the Madhukesvara Temple, Banavasi",
]
# A separate nearby shrine; do not count it as a Madhukeshwara Temple photograph.
EXCLUDE_TITLES = {"Ardha Ganapati Temple, Banavasi.jpg"}
LOCAL_ORIGINALS = {
    "Entrance to Madhukeshvara temple at Banavasi.JPG": "public/images/temple/originals/entrance-banavasi.jpg",
    "Madhukeshwara Temple, Banavasi.jpg": "public/images/temple/originals/madhukeshwara-courtyard.jpg",
    "Madhukeshwara temple gopura.jpg": "public/images/temple/originals/gopura.jpg",
    "Nandi, Madhukeshwara temple, Banavasi.jpg": "public/images/temple/originals/nandi.jpg",
}


def api(params: dict) -> dict:
    query = urllib.parse.urlencode({**params, "format": "json", "formatversion": 2})
    request = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response)


def category_files(category: str) -> list[str]:
    titles, continuation = [], {}
    while True:
        result = api({"action": "query", "list": "categorymembers", "cmtitle": category,
                      "cmtype": "file", "cmlimit": "500", **continuation})
        titles.extend(member["title"] for member in result.get("query", {}).get("categorymembers", []))
        continuation = result.get("continue", {})
        if not continuation:
            return titles


def clean(value: str) -> str:
    value = re.sub(r"<br\s*/?>", " ", value or "", flags=re.I)
    value = re.sub(r"<[^>]*>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def image_records() -> list[dict]:
    memberships: dict[str, set[str]] = {}
    for category in CATEGORIES:
        for title in category_files(category):
            memberships.setdefault(title, set()).add(category)
    titles = [t for t in memberships if t.startswith("File:") and t[5:] not in EXCLUDE_TITLES]
    records = []
    for offset in range(0, len(titles), 10):
        batch = titles[offset:offset + 10]
        result = api({"action": "query", "titles": "|".join(batch), "prop": "imageinfo",
                      "iiprop": "url|size|extmetadata", "iilimit": "1"})
        for page in result.get("query", {}).get("pages", []):
            info = (page.get("imageinfo") or [{}])[0]
            meta = info.get("extmetadata", {})
            license_name = clean(meta.get("LicenseShortName", {}).get("value", ""))
            license_url = clean(meta.get("LicenseUrl", {}).get("value", ""))
            allowed = bool(re.match(r"^(CC BY(?:-SA)?(?:\s|$)|CC0\b|Public domain\b|PD\b)", license_name, re.I))
            title = page["title"]
            filename = title[5:]
            page_url = "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"), safe=":(),_-.'")
            records.append({
                "title": filename,
                "page_url": page_url,
                "original_url": info.get("url", ""),
                "width": info.get("width", 0),
                "height": info.get("height", 0),
                "description": clean(meta.get("ImageDescription", {}).get("value", "")),
                "author": clean(meta.get("Artist", {}).get("value", "")) or clean(meta.get("Credit", {}).get("value", "")),
                "license": license_name,
                "license_url": license_url,
                "allowed": allowed,
                "categories": sorted(memberships[title]),
            })
        time.sleep(0.2)
    records.sort(key=lambda item: (item["title"].lower()))
    return records


def slugify(title: str) -> str:
    stem = Path(title).stem
    ascii_stem = unicodedata.normalize("NFKD", stem).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_stem).strip("-").lower()
    return slug[:90] or "banavasi-temple-photo"


def download_file(url: str, destination: Path) -> None:
    temporary = destination.with_suffix(destination.suffix + ".part")
    for attempt in range(7):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=120) as response, temporary.open("wb") as target:
                shutil.copyfileobj(response, target)
            if temporary.stat().st_size < 2048:
                raise ValueError(f"Unexpectedly small image response for {destination.name}")
            temporary.replace(destination)
            return
        except urllib.error.HTTPError as error:
            temporary.unlink(missing_ok=True)
            if error.code not in (429, 500, 502, 503, 504) or attempt == 6:
                raise
            retry_after = error.headers.get("Retry-After", "")
            delay = int(retry_after) if retry_after.isdigit() else min(180, 20 * (attempt + 1))
            print(f"Commons rate limit/temporary error ({error.code}); retrying in {delay}s", flush=True)
            time.sleep(delay + random.uniform(1, 4))
        except Exception:
            temporary.unlink(missing_ok=True)
            raise


def make_inventory(records: list[dict], outputs: dict[str, dict]) -> str:
    rows = [
        "# Madhukeshwara Temple image inventory",
        "",
        "**Research/collection date:** 7 November 2026  ",
        "**Scope:** Genuine temple photographs sourced from Wikimedia Commons categories for Madhukesvara Temple, Banavasi and its Nandi. The Ardha Ganapati Temple image was excluded because it depicts a separate shrine. NativePlanet and Flickr were reviewed as discovery sources; their pages do not grant reuse rights to their hosted/member photos, so those photos were not copied. NativePlanet credits that point to Commons are represented by the Commons originals below.",
        "",
        "All retained photographs are in the identified category and have an individually checked reusable licence. Original downloads are archived in `assets/temple-originals/`; optimized WebP derivatives are in `public/images/temple/gallery/`. Image processing: EXIF orientation applied, longest dimension capped at 2400 px, WebP quality 88. Attribution links and licence links are listed for every item.",
        "",
        f"**Collected:** {len(outputs)} photographs  ",
        "**Rights-cleared target:** 35–50 photographs. Any gap is stated at the end of this inventory.",
        "",
        "| # | Local WebP | Original file / source page | Photographer | Licence | Dimensions (source → WebP) | Subject notes |",
        "|---:|---|---|---|---|---|---|",
    ]
    for i, record in enumerate(records, 1):
        output = outputs.get(record["title"])
        if not output:
            continue
        author = record["author"] or "Not stated on file page"
        lic = record["license"] or "Licence not identified"
        notes = record["description"].replace("|", "\\|") or "Commons category image; caption unavailable"
        dimensions = f"{record['width']}×{record['height']} → {output['width']}×{output['height']}"
        file_link = f"[`{output['webp_name']}`](../public/images/temple/gallery/{output['webp_name']})"
        source = f"[{record['title']}]({record['page_url']})"
        licence_link = f"[{lic}]({record['license_url']})" if record["license_url"] else lic
        rows.append(f"| {i} | {file_link} | {source} | {author} | {licence_link} | {dimensions} | {notes} |")
    rows += [
        "",
        "## Source review and image gaps",
        "",
        "- Wikimedia Commons file pages are the source for creator, licence and subject attribution. CC BY and CC BY-SA assets require the adjacent creator credit, source link, licence link and indication of processing shown in the gallery and site credit page.",
        "- HRCE Karnataka’s virtual-tour page is an official discovery source, but no downloadable image licence was identified there; its images were not copied.",
        "- NativePlanet’s gallery presents some Commons images with photographer credits; its own hosted images carry no reuse licence on the gallery page and were not downloaded.",
        "- The supplied Flickr album contains 19 photographs, but individual Flickr photo pages/usage terms were unavailable for verification during this collection. Flickr states that member images are All Rights Reserved by default unless an explicit licence is shown. No Flickr-hosted image was downloaded.",
        "- The inspected categories did not provide a verified festival/Rathotsava photograph, and no separately verified close view of the main linga was identified. These remain photography gaps; no unrelated or AI-generated images are substituted.",
        "- Archive and WebP paths are local project assets. Confirm current Commons file-page terms and keep the attribution in place before any public release.",
        "",
    ]
    return "\n".join(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--download", action="store_true", help="Download originals, make WebP derivatives and update the image inventory")
    args = parser.parse_args()
    records = image_records()
    usable = [item for item in records if item["allowed"] and item["original_url"] and item["width"] and item["height"]]
    print(f"Commons category candidates: {len(records)}; reusable, dimensioned images: {len(usable)}")
    for item in usable:
        print(f"{item['width']}x{item['height']} | {item['license']} | {item['author'] or 'author not stated'} | {item['title']}")
    if not args.download:
        return
    if len(usable) < 35:
        raise SystemExit(f"Only {len(usable)} individually licensed candidates; refusing to claim the 35-image target.")
    originals = ROOT / "assets" / "temple-originals"
    gallery = ROOT / "public" / "images" / "temple" / "gallery"
    originals.mkdir(parents=True, exist_ok=True)
    gallery.mkdir(parents=True, exist_ok=True)
    outputs: dict[str, dict] = {}
    for index, record in enumerate(usable[:50], 1):
        ext = Path(urllib.parse.urlparse(record["original_url"]).path).suffix.lower() or ".jpg"
        stem = slugify(record["title"])
        original_path = originals / f"{stem}{ext}"
        webp_name = f"{stem}.webp"
        webp_path = gallery / webp_name
        local_existing = LOCAL_ORIGINALS.get(record["title"])
        if local_existing and (ROOT / local_existing).is_file():
            shutil.copy2(ROOT / local_existing, original_path)
        elif not original_path.exists() or original_path.stat().st_size < 2048:
            download_file(record["original_url"], original_path)
        with Image.open(original_path) as opened:
            image = ImageOps.exif_transpose(opened)
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGB")
            image.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
            image.save(webp_path, "WEBP", quality=88, method=6)
            width, height = image.size
        outputs[record["title"]] = {"webp_name": webp_name, "width": width, "height": height}
        print(f"[{index}/{min(50, len(usable))}] {webp_name}")
        time.sleep(2.5)
    inventory = make_inventory(usable[:50], outputs)
    (ROOT / "docs" / "image-sources.md").write_text(inventory, encoding="utf-8")
    print(f"Inventory updated: {len(outputs)} images")


if __name__ == "__main__":
    main()
