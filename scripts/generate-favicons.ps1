Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$public = Join-Path $root 'public'
$sourcePath = Join-Path $root 'assets/favicons/ornate-banavasi-shiva-temple-emblem.png'

if (!(Test-Path -LiteralPath $sourcePath)) {
  throw "Missing supplied emblem: $sourcePath"
}

$source = [System.Drawing.Image]::FromFile($sourcePath)
try {
  $icons = @(
    @{ Name = 'favicon-16x16.png'; Size = 16 },
    @{ Name = 'favicon-32x32.png'; Size = 32 },
    @{ Name = 'favicon-48x48.png'; Size = 48 },
    @{ Name = 'apple-touch-icon.png'; Size = 180 },
    @{ Name = 'android-chrome-192x192.png'; Size = 192 },
    @{ Name = 'android-chrome-512x512.png'; Size = 512 }
  )

  $pngBytes = @{}
  foreach ($icon in $icons) {
    $bitmap = [System.Drawing.Bitmap]::new($icon.Size, $icon.Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear([System.Drawing.Color]::Transparent)
      $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.DrawImage($source, [System.Drawing.Rectangle]::new(0, 0, $icon.Size, $icon.Size))
      $target = Join-Path $public $icon.Name
      $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
      $pngBytes[$icon.Size] = [System.IO.File]::ReadAllBytes($target)
    } finally {
      $graphics.Dispose()
      $bitmap.Dispose()
    }
  }

  $icoPath = Join-Path $public 'favicon.ico'
  $stream = [System.IO.File]::Open($icoPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
  $writer = [System.IO.BinaryWriter]::new($stream)
  try {
    $icoSizes = @(16, 32, 48)
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$icoSizes.Count)
    $offset = 6 + (16 * $icoSizes.Count)
    foreach ($size in $icoSizes) {
      $edge = if ($size -eq 256) { [byte]0 } else { [byte]$size }
      $writer.Write($edge)
      $writer.Write($edge)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$pngBytes[$size].Length)
      $writer.Write([UInt32]$offset)
      $offset += $pngBytes[$size].Length
    }
    foreach ($size in $icoSizes) { $writer.Write($pngBytes[$size]) }
  } finally {
    $writer.Dispose()
    $stream.Dispose()
  }
} finally {
  $source.Dispose()
}

Write-Output 'Generated favicon.ico (16, 32, 48) and PNG icon variants from the supplied circular emblem.'
