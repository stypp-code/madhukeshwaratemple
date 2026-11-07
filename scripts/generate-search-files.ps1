param([Parameter(Mandatory=$true)][string]$SiteOrigin)
$ErrorActionPreference = 'Stop'
$parsed = [Uri]$SiteOrigin
if ($parsed.Scheme -ne 'https' -or $parsed.AbsoluteUri.TrimEnd('/') -ne $SiteOrigin.TrimEnd('/')) {
  throw 'SiteOrigin must be the approved HTTPS origin only, for example https://approved.example.org'
}
$paths = @('','about.html','history.html','deity.html','architecture.html','festivals.html','seva.html','donations.html','annadana.html','news.html','gallery.html','videos.html','panchanga.html','visitor-information.html','contact.html','privacy.html','terms.html','image-credits.html')
$images = @{'index.html'='images/temple/exterior/entrance-banavasi.jpg';'about.html'='images/temple/exterior/entrance-banavasi.jpg';'history.html'='images/temple/exterior/madhukeshwara-courtyard.jpg';'deity.html'='images/temple/nandi/nandi.jpg';'architecture.html'='images/temple/architecture/triloka-mantapa.jpg';'festivals.html'='images/temple/architecture/gopura.jpg';'seva.html'='images/temple/exterior/entrance-banavasi.jpg';'donations.html'='images/temple/exterior/madhukeshwara-courtyard.jpg';'annadana.html'='images/temple/exterior/entrance-banavasi.jpg';'news.html'='images/temple/architecture/gopura.jpg';'gallery.html'='images/temple/exterior/entrance-banavasi.jpg';'videos.html'='images/temple/exterior/madhukeshwara-courtyard.jpg';'panchanga.html'='images/temple/architecture/gopura.jpg';'visitor-information.html'='images/temple/exterior/madhukeshwara-courtyard.jpg';'contact.html'='images/temple/exterior/entrance-banavasi.jpg';'privacy.html'='images/temple/exterior/madhukeshwara-courtyard.jpg';'terms.html'='images/temple/architecture/gopura.jpg';'image-credits.html'='images/temple/architecture/triloka-mantapa.jpg'}
$urls = $paths | ForEach-Object { '<url><loc>' + [System.Security.SecurityElement]::Escape(($SiteOrigin.TrimEnd('/') + '/' + $_)) + '</loc></url>' }
$xml = @('<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">') + $urls + @('</urlset>')
[System.IO.File]::WriteAllLines((Join-Path $PSScriptRoot '..\sitemap.xml'), $xml, [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllLines((Join-Path $PSScriptRoot '..\robots.txt'), @('User-agent: *','Allow: /',"Sitemap: $($SiteOrigin.TrimEnd('/'))/sitemap.xml"), [System.Text.UTF8Encoding]::new($false))
foreach ($path in $paths) {
  $fileName = if ($path) { $path } else { 'index.html' }
  $filePath = Join-Path $PSScriptRoot "..\$fileName"
  $html = [System.IO.File]::ReadAllText($filePath)
  $canonical = $SiteOrigin.TrimEnd('/') + '/' + $path
  $image = $SiteOrigin.TrimEnd('/') + '/' + $images[$fileName]
  $html = $html -replace '<link rel="canonical" href="[^"]*">',''
  $seo = '<link rel="canonical" href="' + $canonical + '"><meta property="og:url" content="' + $canonical + '"><meta property="og:image" content="' + $image + '">'
  $html = $html.Replace('</head>',"$seo</head>")
  [System.IO.File]::WriteAllText($filePath,$html,[System.Text.UTF8Encoding]::new($false))
}
Write-Output 'Generated sitemap.xml and robots.txt for the approved site origin.'
