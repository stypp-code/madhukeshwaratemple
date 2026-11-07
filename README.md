# Shri Madhukeshwara Temple — website concept

This is a static HTML, CSS and JavaScript website. After changing page content in `site.js`, run `node scripts/prerender.mjs` to regenerate the crawlable HTML for every route. Run `node scripts/serve.mjs` for a local preview at `http://127.0.0.1:8000`.

The site is a research-backed concept, not an official temple website. Operational details, identity and service integrations require administration approval. See [the research record](docs/temple-research.md), [photo credits](docs/image-sources.md), and [implementation report](docs/implementation-report.md).

Before deployment, obtain the approved HTTPS domain and run `scripts/generate-search-files.ps1 -SiteOrigin https://approved-domain.example` in PowerShell. The script emits the absolute `sitemap.xml` and matching `robots.txt`; these are intentionally not generated against an invented domain.

No payment, seva booking, enquiry submission, Panchanga, livestream, social account or accommodation service is connected.
