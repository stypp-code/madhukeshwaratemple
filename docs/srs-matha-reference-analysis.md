# SRS Matha Homepage: Frontend Reverse-Engineering Notes

Reference inspected: [srsmatha.org](https://srsmatha.org/) on 2026-11-07. This document records the publicly rendered frontend and the adaptation plan for the existing static Madhukeshwara Temple site. It does not copy SRS branding, text, code, backend services, or image assets.

## Reference structure and observed layout

At a 1536 × 730 desktop viewport, the page uses a full-width layout with a 15 px vertical scrollbar. The top warning strip is about 46 px tall. A transparent, overlaid header occupies about 160 px at the top of the banner: brand mark and two-line wordmark on the left; a rounded, warm-yellow horizontal navigation bar on the right. The banner begins immediately below the top strip, extends about 718 px, and cycles through wide 1170 × 620 photo posters. The banner carries no large headline overlay. A second safety notice sits at its lower edge.

The header uses a serif face (`Noto Serif` in computed styles), with navigation around 16 px. The wordmark is yellow/gold. The desktop nav has five top-level links (Home, About us, Online Services, News, Contact Us). About and Online Services contain nested submenus; Online Services has several levels. The page also has fixed vertical Panchanga and Tech Support tabs at the left edge. The observed public navigation is primarily anchor based. The site exposes one public stylesheet (`/style.css`) and AOS CSS/JS; the visible image/poster dimensions and routes were inspected, without copying those assets.

Below the banner, the main order is:

1. **Welcome** — a wide, two-part feature: rotating three-photo swamiji panel on the left and a welcome heading plus introductory copy on the right. At desktop the section is about 800 px tall and has generous vertical whitespace.
2. **Live availability and services** — a pale section with roughly 100 px vertical padding. A live-room panel precedes a two-column area: online services on one side and latest news on the other. The live widget presents an update stamp, live status and A/B/C room wings. Online services are six compact icon-led entries (Seva Booking, Room Booking, Donation, Donor Booking, Booking History, Panchanga). Latest News is a dated list with thumbnails and a “View All” action.
3. **Technology services** — dark photographic/colour feature section with centered lead-in and a wide two-column composition: service explanation and bullet list, plus “How to book rooms” video. A three-item app-download row follows. The approximate section height is 1154 px on desktop.
4. **Preserving Legacy / Nurturing Futures** — light background, centered heading, then four horizontally arranged content panels for Educational Institutes, Dasa Sahitya Museum, Veda Pathashala and Goshala. Each panel pairs a heading and copy with an image/action. It is carousel-like on desktop rather than a repeated small-card grid. Approximate desktop height: 929 px.
5. **Connect with Sri Matha in the Digital Space** — dark section, centered heading and short introduction, followed by a row of five social-channel links. Approximate desktop height: 669 px.
6. **Footer** — dark, full-width base. Four information groups: About SRSMatha, Matha Information, Quick Links and contact/technical support, then a lower legal/copyright row. Approximate desktop height: 465 px.

The live reference uses a warm cream base (`#fffdf5` observed on the service section), dark brown text (`rgb(58,31,15)`), bright orange/yellow navigation, red safety bars, and white text on dark photographic/colour sections. It uses `Noto Serif` across body and headings; heading weights are mostly 700. Measured headings include a 32 px welcome heading and 28 px live-availability heading. The reference palette is not carried over; the Madhukeshwara identity below supplies the replacement colours.

## Responsive behaviour observed

At 1024 px, the layout remains in desktop mode: the logo/wordmark and horizontal navigation sit side by side; the live/service/news region remains multi-column; heritage panels remain horizontally arranged. At 390 px, a single breakpoint at `max-width: 768px` changes the banner to the viewport width and makes its image fill a tall, approximately 717 px area. Main text and imagery become a vertical flow; service/news and other multi-column areas stack; the footer becomes one column. The navigation becomes an off-canvas panel. The captured small-screen DOM places it just outside the viewport while closed, and top-level links become full-width rows; its nested submenu entries are collapsed. Fixed edge tabs remain visible. The reference has no persistent hamburger button in the captured DOM; the Madhukeshwara implementation will use an accessible toggle for the equivalent mobile panel.

The source layout is fluid/full-width rather than a narrow centered editorial column. Major text/photo pairs use approximately 20–40 px internal gutters; the welcome panel uses a 40 px inter-column gap. Large sections typically use 60–120 px vertical padding. The footer uses four equal desktop columns with a 40 px gap and collapses to one column on mobile.

## Component mapping and content guardrails

| SRS Matha component | Madhukeshwara Temple equivalent | Adaptation rule |
| --- | --- | --- |
| Header, logo and nav | Temple name/mark and primary navigation | Keep compact, overlay proportions and a nested About / Services menu; preserve existing page links. |
| Photo banner | Temple photo banner | Use existing licensed temple WebP files with the reference’s wide image-led treatment, no oversized text over the photo. |
| Welcome section | Temple introduction | Pair one temple photograph with a short introduction and link to the About/History pages. |
| Live room availability | Temple timings and visitor information | Do not present live status, exact hours or room availability. Clearly indicate that current operational details need confirmation. |
| Online services | Temple services and facilities | Keep the icon-led list arrangement but link only to existing informational pages. Do not claim booking, payment, donation channels or facilities are operational. |
| Latest news | Temple announcements and festivals | Use existing verified heritage/festival content and clearly mark administrator notices as pending; no invented dates or events. |
| Technology services | Temple digital information | Reuse the dark two-column feature area to explain this site’s information and visit resources; omit fake apps, room booking or unsupported media. |
| Educational institutions | Temple heritage and architecture | Replace educational institution claims with Banavasi/Kadamba historical context and architecture, using an existing heritage page and genuine images. |
| Museum sections | Sculpture and historical heritage | Use the editorial panel pattern for sculptures, mantapa, Nandi, or historic objects; no invented museum institution. |
| Footer | Temple contact and visitor details | Use the reference’s grouped footer hierarchy and existing site links. Keep unverified contact details absent and link the map search only as a location aid. |
| Social channels and app cards | Temple notices / online information | Omit unverified social links and app download claims; do not substitute fabricated temple accounts. |

## Image review

The project currently contains 35 locally tracked WebP files under `public/images/temple/gallery/` (not 22). All 35 were inspected in a local contact sheet. They show Banavasi temple exteriors and campus views, entrances, shrine/gopura details, pillared halls, Nandi, elephants, navagraha reliefs, sculpted stonework, the Triloka Mantapa and a carved stone bed. No unrelated temple images were identified. The renderer’s curated, attributed photo set contains 22 files; the extra 13 tracked assets also appear in `docs/image-sources.md` but are not part of that renderer set. The implementation uses the existing curated set and its existing source/licence credits; it does not download duplicate images. Gallery and prominent placement prioritize clear, wide exterior/entrance views, then use Nandi, pillars and sculpture images in relevant editorial sections.

## Implementation scope

The project is already a multi-page static HTML/CSS/JavaScript site. The work will keep that architecture and existing routes. The home page and shared shell will be adjusted to the measured reference sequence and proportions; secondary pages will retain their page content and navigation, receiving only shared-shell/CSS changes needed for consistency. The adopted palette is Heritage Indigo `#283451`, Terracotta `#A64F3C`, Muted Saffron `#D69A3B`, Warm Ivory `#F7F4EC`, Dark Stone `#292B30`, and Antique Copper `#B47A52`.
