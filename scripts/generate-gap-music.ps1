$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$musicDir = Join-Path $root "public\music"
$tmpDir = Join-Path $root ".tmp"
$outputPath = Join-Path $musicDir "conferencehype-gap-music-6min-v1.mp3"
$stingerPath = Join-Path $tmpDir "conferencehype-stinger.wav"

New-Item -ItemType Directory -Force $musicDir | Out-Null
New-Item -ItemType Directory -Force $tmpDir | Out-Null

py -3.12 (Join-Path $root "scripts\generate-kokoro-dj-voice.py") --mode stinger --voice am_adam --output $stingerPath

$ffmpeg = Join-Path $root "node_modules\ffmpeg-static\ffmpeg.exe"
if (!(Test-Path $ffmpeg)) {
  $ffmpeg = "ffmpeg"
}

$delays = @(8, 42, 76, 111, 146, 181, 216, 251, 286, 321)
$stingers = @()
for ($i = 0; $i -lt $delays.Count; $i++) {
  $ms = $delays[$i] * 1000
  $stingers += "[5:a]volume=1.65,adelay=$ms|$ms,apad[s$i]"
}
$stingerLabels = (0..($delays.Count - 1) | ForEach-Object { "[s$_]" }) -join ""

$filter = @"
[0:a]volume=0.95[kick];
[1:a]volume=0.55[bass];
[2:a]volume=0.22[lead];
[3:a]volume=0.08[air];
[4:a]volume=0.16[pulse];
$($stingers -join ";");
[kick][bass][lead][air][pulse]$stingerLabels amix=inputs=15:duration=longest:normalize=0,acompressor=threshold=-14dB:ratio=3:attack=8:release=160,alimiter=limit=0.92,afade=t=in:st=0:d=2,afade=t=out:st=356:d=4[out]
"@

& $ffmpeg -y `
  -f lavfi -i "aevalsrc=0.95*sin(2*PI*58*t)*exp(-mod(t\,0.48)*22):d=360:s=44100" `
  -f lavfi -i "aevalsrc=0.45*sin(2*PI*(88+22*gt(mod(t\,1.92)\,0.96))*t)*(0.35+0.65*gt(mod(t\,0.96)\,0.48)):d=360:s=44100" `
  -f lavfi -i "aevalsrc=0.28*sin(2*PI*(440+220*gt(mod(t\,7.68)\,3.84))*t)*(0.15+0.85*gt(mod(t\,0.24)\,0.12)):d=360:s=44100" `
  -f lavfi -i "anoisesrc=d=360:c=pink:r=44100" `
  -f lavfi -i "aevalsrc=0.34*sin(2*PI*1760*t)*gt(mod(t\,0.24)\,0.12):d=360:s=44100" `
  -i $stingerPath `
  -filter_complex $filter `
  -map "[out]" `
  -t 360 `
  -ar 44100 `
  -ac 2 `
  -c:a libmp3lame `
  -b:a 192k `
  $outputPath

Write-Host "Generated gap music: $outputPath"
