# Temple Heritage Background Assets

The patterns in this directory were supplied for the Madhukeshwara Temple website. They are used as low-contrast decorative interpretations behind site content, not as documentary records or claims that every depicted feature belongs to one construction period.

## Assets

| Public WebP | Artwork motif | Use |
| --- | --- | --- |
| `shankha-chakra-festive-ornament.webp` | Shankha and Chakra repeat | Festivals page |
| `floral-pillar-capital-ornament.webp` | Floral stone ornament and pillar capitals | Annadana page |
| `carved-pillars-and-stone-cot.webp` | Pillars, arches and the carved stone cot | Architecture page |
| `navaranga-pillar-details.webp` | Carved pillar details | About page and homepage service area |
| `nandi-pillared-hall.webp` | Nandi with pillared-hall motifs | Deity page |
| `stepped-temple-shikhara.webp` | Stepped shrine towers | Footer ornament |
| `temple-arches-and-stone-borders.webp` | Temple arches and carved borders | Homepage introduction, visitor information and contact pages |
| `lotus-geometric-ornament.webp` | Geometric lotus border pattern | Panchanga and photo gallery pages |
| `naga-inscription-and-shrine.webp` | Naga, inscription and shrine motifs | Banavasi history page |
| `lotus-rosette-pattern.webp` | Lotus rosette ornament | Homepage heritage, video page |
| `carved-elephants-and-entrance.webp` | Carved entrance elephants | News page |

The matching full-resolution PNG sources are retained in [`../assets/temple-backgrounds/originals/`](../assets/temple-backgrounds/originals/). The public WebP files use quality 95 encoding to keep the fine linework clear while reducing transfer size. The supplied nameboard is preserved as a transparent PNG at [`../public/images/temple/nameboard-madhukeshwara.png`](../public/images/temple/nameboard-madhukeshwara.png) and is reused in both the homepage header and footer.

## Source deduplication

Fifteen background image attachments were provided, representing eleven unique artworks. Exact duplicates were identified by SHA-256 and retained once: the shankha/chakra file was attached twice; `rm4d3drm4d3drm4d (9).png` and `(12).png` match `(1).png`; `(11).png` matches `(6).png`. No distinct artwork was discarded.

## Styling

CSS assigns an individual asset to each relevant section/page. The patterns use fixed-ratio backgrounds with responsive sizing and a reduced pseudo-element opacity, so the artwork remains behind headings, prose, photographs and white content panels. The footer uses the stepped-shikhara motif at lower opacity. The Shankha and Chakra image appears only as a festival-page decoration and is not used as a logo.
