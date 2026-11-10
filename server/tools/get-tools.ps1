# server/tools/get-tools.ps1 - tai cong cu da ghim vao server/tools/<ten>/
# Chay tu server/: powershell -ExecutionPolicy Bypass -File tools/get-tools.ps1
# Nguon, ban ghim, SHA256: .ai/research/2026-11-01-research-thong-nhat-processbuilder-core-job-wrapper-theo-doi-cong-cu-video-anh-raw (muc 2.12.2)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # PS 5.1 tai cham han khi hien thanh tien do

# Worker dang chay thi khong thay thu muc cong cu no dang dung
$running = Get-CimInstance Win32_Process -Filter "Name='java.exe'" |
  Where-Object { $_.CommandLine -match 'filesharing-(videocodec|imagecodec|imagerawproccess)' }
if ($running) {
  Write-Host "Worker dang chay (PID $(@($running.ProcessId) -join ', ')). Dung worker truoc khi chay script."
  exit 1
}

$tools = @(
  @{ Name = 'ffmpeg'
     Url  = 'https://github.com/BtbN/FFmpeg-Builds/releases/download/autobuild-2026-10-31-12-59/ffmpeg-n9.0.2-39-g7adfbe40dc-win64-gpl-9.0.zip'
     Sha  = '693f3e224bc184b40524a62ca47526cfebaf2504414021b92fe75f677ad868b9'
     Check = { & "$dir\bin\ffmpeg.exe" -hide_banner -encoders | Select-String -Quiet libx264 } }
  @{ Name = 'vips'
     Url  = 'https://github.com/libvips/build-win64-mxe/releases/download/v8.18.7/vips-dev-x64-web-8.18.7.zip'
     Sha  = '3a122eb3d588690008216f786338e2f9329dba3c3c2768b5933cf7299d549241'
     Check = { & "$dir\bin\vips.exe" -l | Select-String -Quiet webpsave } }
  @{ Name = 'exiftool'
     Url  = 'https://sourceforge.net/projects/exiftool/files/exiftool-13.61_64.zip/download'
     Sha  = 'ab75b37515385a753aa60a58f68ffffe1ff81e43b319df9540978fb19e0580e5'
     Check = { (& "$dir\exiftool.exe" -ver) -eq '13.61' } }
)

foreach ($t in $tools) {
  $dir = Join-Path $PSScriptRoot $t.Name
  $zip = Join-Path $env:TEMP "fs-tools-$($t.Name).zip"
  Write-Host "tai $($t.Name)"
  # UA kieu curl: SourceForge tra thang file thay vi trang HTML dem nguoc
  Invoke-WebRequest $t.Url -OutFile $zip -UserAgent 'curl/8'
  $hash = (Get-FileHash $zip -Algorithm SHA256).Hash
  if ($hash -ne $t.Sha) {
    Remove-Item $zip -Force
    throw "$($t.Name): SHA256 khong khop (nhan $hash)"
  }
  Remove-Item $dir, "$dir.tmp" -Recurse -Force -ErrorAction SilentlyContinue
  Expand-Archive $zip "$dir.tmp"
  Move-Item (Get-ChildItem "$dir.tmp" -Directory)[0].FullName $dir   # bo thu muc goc cua zip
  Remove-Item "$dir.tmp", $zip -Recurse -Force
  if ($t.Name -eq 'exiftool') { Rename-Item "$dir\exiftool(-k).exe" 'exiftool.exe' }
  if (-not (& $t.Check)) { throw "$($t.Name): kiem sau khi cai that bai" }
  Write-Host "ok $($t.Name)"
}

$r = $PSScriptRoot -replace '\\', '/'      # .env nap theo dinh dang .properties: '\' la ky tu escape
Write-Host "Dan cac dong sau vao .env cua tung module:"
"videocodec/.env:  FFMPEG_PATH=$r/ffmpeg/bin/ffmpeg.exe",
"videocodec/.env:  FFPROBE_PATH=$r/ffmpeg/bin/ffprobe.exe",
"imagecodec/.env:  VIPS_PATH=$r/vips/bin/vips.exe",
"imagecodec/.env:  VIPSHEADER_PATH=$r/vips/bin/vipsheader.exe",
"imagerawproccess/.env:  EXIFTOOL_PATH=$r/exiftool/exiftool.exe"
