$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$renderDir = Join-Path $root "public\rendered"
New-Item -ItemType Directory -Force $renderDir | Out-Null

$slides = @(
@"
ASCO Hype - Day 1 Opening
Friday May 29, 7:00 AM CT test clock
First 15 minutes: conference-desk ramp
Source: precomputed ASCO 2026 agenda spine
"@,
@"
Opening desk map
24 agenda sessions on Day 1
67 timed oral abstract presentations
Title-level abstract signals stay provisional
No medical advice, no scientific validation
"@,
@"
Tracks to watch today
Pediatric Oncology leads the room map
Medical Education and Professional Development is close behind
Care Delivery and Models of Care stays on the board
Hematologic malignancies lymphoma and CLL anchors the afternoon
"@,
@"
First 15-minute read
No official sessions are scheduled in the next 15 minutes
Use the opening block to orient listeners
Verify rooms in the ASCO app and on-site signage
Audience tips remain buzz until operator review
"@,
@"
Tentpoles later today
1:00 PM CT: Hematologic Malignancies Lymphoma and CLL, E450a
1:00 PM CT: Lung Cancer NSCLC Metastatic, Hall D2
2:45 PM CT: Medical Education and Professional Development, E450b
No plenary session is scheduled for Day 1 in this index
"@,
@"
Audience loop
Tag #ASCOHype with coffee, snacks, poster-wall buzz, and media moments
The desk watches OncLive, STAT News, The ASCO Post, X, and operator inputs
Every broadcast item stays review-gated before it becomes commentary
"@
)

for ($i = 0; $i -lt $slides.Count; $i++) {
  Set-Content -LiteralPath (Join-Path $renderDir "day1-opening-slide-$($i + 1).txt") -Value $slides[$i] -Encoding UTF8
}

$script = @"
ASCO Hype is interactive AI commentary only. It is not reporting, journalism, medical education, clinical guidance, scientific validation, legal advice, or financial advice. ASCO Hype is not associated with the American Society of Clinical Oncology in any way.

Welcome to ASCO Hype for Day 1. For this production rehearsal, we are treating the clock as Friday, May 29 at 7:00 AM Central Time, the opening ramp of ASCO Day 1.

Here is the first fifteen-minute desk plan. The official ASCO program index does not show a session starting in this immediate opening window, so the broadcast begins with orientation, not claims. The room map says Day 1 has twenty-four agenda sessions and sixty-seven timed oral abstract presentations. The leading watch tracks are Pediatric Oncology, Medical Education and Professional Development, Care Delivery and Models of Care, and Hematologic Malignancies, Lymphoma and Chronic Lymphocytic Leukemia.

The operator instruction is simple. Keep the audience grounded in the official schedule. Treat title-level abstract signals as provisional until primary sources and full text are available. Repeat rooms clearly, and tell people to verify locations in the ASCO app and on-site signage.

Later today, the desk is watching the one PM Central rapid oral abstract block for Hematologic Malignancies, Lymphoma and CLL in E450a, the one PM Central Lung Cancer non-small cell metastatic oral abstract session in Hall D2, and the two forty-five PM Medical Education and Professional Development rapid oral session in E450b. No plenary session is scheduled for Day 1 in the provided agenda index.

Audience loop: if you find genuinely useful coffee, snacks, poster-wall energy, media moments, or hallway tips, tag #ASCOHype. The desk can review those inputs, but they stay audience buzz until an operator approves the framing. This is the Day 1 opening ramp. The next schedule spine hit takes over after this block.

Reminder: ASCO Hype is interactive AI commentary only. It is not reporting, journalism, medical education, clinical guidance, scientific validation, legal advice, or financial advice.
"@

$scriptPath = Join-Path $renderDir "day1-opening-script.txt"
$voicePath = Join-Path $renderDir "day1-opening-voice.mp3"
$outputPath = Join-Path $renderDir "fallback-loop.mp4"
$previewPath = Join-Path $renderDir "fallback-loop-preview.png"

Set-Content -LiteralPath $scriptPath -Value $script -Encoding UTF8

if (!(Test-Path -LiteralPath $voicePath)) {
  throw "Missing $voicePath. Generate it with the configured TTS provider before rendering."
}

$ffmpeg = Join-Path $root "node_modules\ffmpeg-static\ffmpeg.exe"
function Escape-DrawText([string]$value) {
  return $value.Replace("\", "\\").Replace(":", "\:").Replace("'", "\'").Replace("%", "\%")
}

$slideFilters = @()
for ($i = 0; $i -lt $slides.Count; $i++) {
  $fontsize = @(44, 42, 38, 40, 34, 36)[$i]
  $y = @(150, 150, 130, 150, 145, 155)[$i]
  $chain = "[$i`:v]"
  $lines = $slides[$i] -split "`r?`n" | Where-Object { $_.Trim().Length -gt 0 }
  for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) {
    $line = Escape-DrawText($lines[$lineIndex].Trim())
    $color = if ($lineIndex -eq 0) { "white" } elseif ($lineIndex -eq 1) { "0xffcf5a" } else { "0xe8edf5" }
    $lineY = $y + ($lineIndex * ($fontsize + 18))
    $chain += "drawtext=font='Arial':text='$line':x=70:y=$lineY`:fontsize=$fontsize`:fontcolor=$color,"
  }
  $chain += "drawbox=x=0:y=0:w=1280:h=16:color=0xf4483a@1:t=fill,drawbox=x=0:y=704:w=1280:h=16:color=0x33d6c5@1:t=fill[v$i]"
  $slideFilters += $chain
}
$filter = ($slideFilters -join ";") + ";[v0][v1][v2][v3][v4][v5]concat=n=6:v=1:a=0[v]"

& $ffmpeg -y `
  -f lavfi -i "color=c=0x11151f:s=1280x720:r=30:d=150" `
  -f lavfi -i "color=c=0x151a27:s=1280x720:r=30:d=150" `
  -f lavfi -i "color=c=0x101722:s=1280x720:r=30:d=150" `
  -f lavfi -i "color=c=0x171925:s=1280x720:r=30:d=150" `
  -f lavfi -i "color=c=0x11151f:s=1280x720:r=30:d=150" `
  -f lavfi -i "color=c=0x151a27:s=1280x720:r=30:d=150" `
  -stream_loop -1 -i $voicePath `
  -filter_complex $filter `
  -map "[v]" -map "6:a" `
  -t 900 `
  -c:v libx264 -preset veryfast -pix_fmt yuv420p `
  -c:a aac -b:a 128k `
  -shortest $outputPath

& $ffmpeg -y -i $outputPath -frames:v 1 -update 1 $previewPath
& $ffmpeg -hide_banner -i $outputPath
