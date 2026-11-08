Add-Type -AssemblyName System.Drawing

$sourcePath = Join-Path $PSScriptRoot "..\public\images\temple\nameboard-madhukeshwara.png"
$targetPath = Join-Path $PSScriptRoot "..\public\images\temple\nameboard-madhukeshwara-cropped.png"
$source = [System.Drawing.Bitmap]::FromFile($sourcePath)

try {
    $minX = $source.Width; $minY = $source.Height; $maxX = -1; $maxY = -1
    for ($y = 0; $y -lt $source.Height; $y++) {
        for ($x = 0; $x -lt $source.Width; $x++) {
            if ($source.GetPixel($x, $y).A -gt 0) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -lt 0) { throw "The nameboard has no visible pixels." }

    # Preserve a slim transparent safety edge around the complete gold outline.
    $padding = 4
    $left = [Math]::Max(0, $minX - $padding); $top = [Math]::Max(0, $minY - $padding)
    $right = [Math]::Min($source.Width - 1, $maxX + $padding); $bottom = [Math]::Min($source.Height - 1, $maxY + $padding)
    $crop = New-Object System.Drawing.Rectangle($left, $top, $right - $left + 1, $bottom - $top + 1)
    $result = New-Object System.Drawing.Bitmap($crop.Width, $crop.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($result)
    try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImage($source, (New-Object System.Drawing.Rectangle(0, 0, $crop.Width, $crop.Height)), $crop, [System.Drawing.GraphicsUnit]::Pixel)
        $result.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $graphics.Dispose()
        $result.Dispose()
    }
} finally {
    $source.Dispose()
}
