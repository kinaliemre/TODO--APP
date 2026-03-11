param(
  [string]$ShortcutName = "TODO App",
  [string]$IconPath = ""
)

Add-Type -AssemblyName System.Drawing

function Convert-PngToIco {
  param(
    [Parameter(Mandatory = $true)]
    [string]$PngPath,
    [Parameter(Mandatory = $true)]
    [string]$IcoPath
  )

  $iconSize = 64
  $src = [System.Drawing.Image]::FromFile($PngPath)
  try {
    $bmp = New-Object System.Drawing.Bitmap($iconSize, $iconSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $gfx = [System.Drawing.Graphics]::FromImage($bmp)
      try {
        $gfx.Clear([System.Drawing.Color]::Transparent)
        $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gfx.DrawImage($src, 0, 0, $iconSize, $iconSize)
      } finally {
        $gfx.Dispose()
      }

      $xorBytesPerRow = $iconSize * 4
      $xorSize = $xorBytesPerRow * $iconSize
      $andBytesPerRow = [int]([Math]::Ceiling($iconSize / 32.0) * 4)
      $andSize = $andBytesPerRow * $iconSize
      $imageSize = 40 + $xorSize + $andSize

      $fs = [System.IO.File]::Open($IcoPath, [System.IO.FileMode]::Create)
      try {
        $bw = New-Object System.IO.BinaryWriter($fs)
        try {
          # ICONDIR
          $bw.Write([UInt16]0)
          $bw.Write([UInt16]1)
          $bw.Write([UInt16]1)

          # ICONDIRENTRY
          $bw.Write([byte]$iconSize)
          $bw.Write([byte]$iconSize)
          $bw.Write([byte]0)
          $bw.Write([byte]0)
          $bw.Write([UInt16]1)
          $bw.Write([UInt16]32)
          $bw.Write([UInt32]$imageSize)
          $bw.Write([UInt32](6 + 16))

          # BITMAPINFOHEADER
          $bw.Write([UInt32]40)
          $bw.Write([Int32]$iconSize)
          $bw.Write([Int32]($iconSize * 2))
          $bw.Write([UInt16]1)
          $bw.Write([UInt16]32)
          $bw.Write([UInt32]0)
          $bw.Write([UInt32]$xorSize)
          $bw.Write([Int32]0)
          $bw.Write([Int32]0)
          $bw.Write([UInt32]0)
          $bw.Write([UInt32]0)

          # XOR mask (BGRA, bottom-up)
          for ($y = $iconSize - 1; $y -ge 0; $y--) {
            for ($x = 0; $x -lt $iconSize; $x++) {
              $c = $bmp.GetPixel($x, $y)
              $bw.Write([byte]$c.B)
              $bw.Write([byte]$c.G)
              $bw.Write([byte]$c.R)
              $bw.Write([byte]$c.A)
            }
          }

          # AND mask (all zero = opaque)
          $andRow = New-Object byte[] $andBytesPerRow
          for ($i = 0; $i -lt $iconSize; $i++) {
            $bw.Write($andRow)
          }
        } finally {
          $bw.Dispose()
        }
      } finally {
        $fs.Dispose()
      }
    } finally {
      $bmp.Dispose()
    }
  } finally {
    $src.Dispose()
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$targetPath = Join-Path $env:WINDIR "System32\wscript.exe"
$launcherVbs = Join-Path $scriptDir "launch-todo.vbs"

if (-not (Test-Path $launcherVbs)) {
  Write-Error "launch-todo.vbs bulunamadi: $launcherVbs"
  exit 1
}

if ([string]::IsNullOrWhiteSpace($IconPath)) {
  $logoPng = Join-Path $projectRoot "frontend\public\TO-DO.png"
  $logoIco = Join-Path $scriptDir "logo.ico"
  if (Test-Path $logoPng) {
    $IconPath = $logoPng
  } else {
    $IconPath = $logoIco
  }
}

$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath ("$ShortcutName.lnk")

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.Arguments = "`"$launcherVbs`""
$shortcut.WorkingDirectory = $projectRoot
$shortcut.WindowStyle = 7
$shortcut.Description = "TODO uygulamasini tek tikla baslat"

if (Test-Path $IconPath) {
  $iconExt = [System.IO.Path]::GetExtension($IconPath).ToLowerInvariant()
  $resolvedIconPath = $IconPath

  if ($iconExt -eq ".png") {
    $generatedIco = Join-Path $scriptDir "generated-logo.ico"
    Convert-PngToIco -PngPath $IconPath -IcoPath $generatedIco
    $resolvedIconPath = $generatedIco
    Write-Host "PNG icon ICO formatina cevrildi: $generatedIco"
  }

  $shortcut.IconLocation = "$resolvedIconPath,0"
  Write-Host "Icon kullanildi: $resolvedIconPath"
} else {
  Write-Warning "Icon bulunamadi. Varsayilan simge kullanilacak. Beklenen yol: $IconPath"
}

$shortcut.Save()
Write-Host "Masaustu kisayolu olusturuldu: $shortcutPath"
