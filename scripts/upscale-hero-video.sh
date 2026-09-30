#!/usr/bin/env bash
# Rebuilds the /thalia hero loop: AI-upscales the owners' 848x478 phone clip with
# Real-ESRGAN (realesrgan-x4plus) and encodes the three variants the landing serves from
# public/site/thalia/ (see THALIA_VIDEO_VARIANTS in app/thalia/thalia.ts).
#
# Wix only transcodes that upload up to 480p, which looked soft across a desktop hero,
# hence the upscale. It is slow (~75 s/frame on an Intel Iris GPU, 283 frames), so the
# upscale step is resumable: re-run the script and it only processes missing frames.
#
# Usage:  scripts/upscale-hero-video.sh [work_dir]      (default: .upscale-work)
# Needs:  ffmpeg, curl, unzip, and a Vulkan device. Without a GPU (e.g. a cloud VM),
#         install a CPU Vulkan driver first: `apt-get install -y mesa-vulkan-drivers`.
#
# The work dir holds ~400 MB of frames and is git-ignored; only the final mp4s are
# committed.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${1:-$ROOT/.upscale-work}"
OUT_DIR="$ROOT/public/site/thalia"
SOURCE_URL="https://video.wixstatic.com/video/fac5f8_c262340b21e2456aa0c72617abf02959/480p/mp4/file.mp4"
ESR_RELEASE="https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0"
FPS="30000/1001"
BATCH=10

mkdir -p "$WORK" "$OUT_DIR"
cd "$WORK"

# 1. Source clip and frames.
if [ ! -f source.mp4 ]; then
  echo "Downloading source clip…"
  curl -fsSL -A "Mozilla/5.0" -o source.mp4 "$SOURCE_URL"
fi
if [ ! -d f0 ] || [ "$(ls f0 | wc -l)" -eq 0 ]; then
  mkdir -p f0
  ffmpeg -v error -i source.mp4 -vsync 0 f0/%04d.png
fi
TOTAL=$(ls f0 | wc -l | tr -d ' ')

# 2. Real-ESRGAN (ncnn/Vulkan build, the same binary on every OS).
if [ ! -x esr/realesrgan-ncnn-vulkan ]; then
  case "$(uname -s)" in
    Darwin) zip="realesrgan-ncnn-vulkan-20220424-macos.zip" ;;
    Linux) zip="realesrgan-ncnn-vulkan-20220424-ubuntu.zip" ;;
    *) echo "Unsupported OS: $(uname -s)" >&2; exit 1 ;;
  esac
  mkdir -p esr
  curl -fsSL -o esr.zip "$ESR_RELEASE/$zip"
  unzip -oq esr.zip -d esr && rm esr.zip
  chmod +x esr/realesrgan-ncnn-vulkan
fi

# 3. Upscale x4, resumable, in small batches.
# -t 128 and -j 1:1:1 keep memory low: small GPU tiles, one frame in flight at a time.
mkdir -p f4
while :; do
  rm -rf batch tmp_out && mkdir -p batch tmp_out
  n=0
  for f in f0/*.png; do
    b=$(basename "$f")
    [ -f "f4/$b" ] && continue
    # Hard links: the upscaler skips symlinks when it lists a directory.
    ln "$f" "batch/$b"
    n=$((n + 1))
    [ "$n" -ge "$BATCH" ] && break
  done
  [ "$n" -eq 0 ] && break
  (cd esr && ./realesrgan-ncnn-vulkan -i ../batch -o ../tmp_out -n realesrgan-x4plus \
    -s 4 -t 128 -j 1:1:1 > ../esr_last.log 2>&1) || true
  if [ -z "$(ls tmp_out)" ]; then
    echo "Upscaler produced no frames; see $WORK/esr_last.log" >&2
    exit 1
  fi
  mv tmp_out/*.png f4/
  echo "$(date +%H:%M:%S) upscaled $(ls f4 | wc -l | tr -d ' ')/$TOTAL"
done

# 4. Encode the web variants: exact 16:9, H.264, no audio, moov up front so the loop can
# start before the whole file arrives. CRF 28 keeps them near 3 / 7 / 12 MB; next to 24
# the difference is invisible behind the hero's dark overlay, at half the weight.
for spec in 1280:720 1920:1080 2560:1440; do
  w=${spec%:*}; h=${spec#*:}
  ffmpeg -v error -y -framerate "$FPS" -i f4/%04d.png \
    -vf "scale=${w}:-2:flags=lanczos,crop=${w}:${h}" \
    -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -profile:v high \
    -an -movflags +faststart "$OUT_DIR/hero-${h}.mp4"
  echo "wrote public/site/thalia/hero-${h}.mp4 ($(du -h "$OUT_DIR/hero-${h}.mp4" | cut -f1))"
done
