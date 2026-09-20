#!/usr/bin/env bash
# cleanup.sh — Purge intermediate brag build artifacts, preserving deliverables.
set -euo pipefail

TARGET_DIR=""
DRY_RUN=false
KEEP_COMPOSITION=false
KEEP_PLAN=false
FORCE=false

usage() {
  cat << 'USAGE'
Usage: cleanup.sh [options]

Options:
  --dir <path>          Path to brag output directory (default: ./brag-output)
  --dry-run             List files to remove without deleting
  --keep-composition    Keep composition/ directory (only remove plan docs)
  --keep-plan           Keep planning docs (only remove composition/)
  --force               Bypass safety check if brag.mp4 is missing
  -h, --help            Show this help message
USAGE
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)
      TARGET_DIR="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --keep-composition)
      KEEP_COMPOSITION=true
      shift
      ;;
    --keep-plan)
      KEEP_PLAN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      ;;
  esac
done

# Resolve TARGET_DIR if not provided
if [[ -z "$TARGET_DIR" ]]; then
  if [[ -d "./brag-output" ]]; then
    TARGET_DIR="./brag-output"
  else
    # Find latest brag-output-* directory
    LATEST=$(find . -maxdepth 1 -type d -name "brag-output*" | sort -r | head -n 1 || true)
    if [[ -n "$LATEST" && -d "$LATEST" ]]; then
      TARGET_DIR="$LATEST"
    else
      echo "Error: No brag-output directory found in current directory." >&2
      echo "Use --dir <path> to specify the location." >&2
      exit 1
    fi
  fi
fi

# Normalize path
TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
echo "Target directory: $TARGET_DIR"

# Safety checks
VIDEO_FILE="$TARGET_DIR/brag.mp4"
POSTER_FILE="$TARGET_DIR/brag.jpg"

if [[ ! -f "$VIDEO_FILE" ]]; then
  if [[ "$FORCE" = false ]]; then
    echo "Error: $VIDEO_FILE not found." >&2
    echo "Safety check failed: Refusing to delete composition source before video is rendered." >&2
    echo "Use --force to override if this is intentional." >&2
    exit 1
  else
    echo "Warning: $VIDEO_FILE not found, but continuing due to --force." >&2
  fi
else
  VIDEO_SIZE=$(stat -f %z "$VIDEO_FILE" 2>/dev/null || stat -c %s "$VIDEO_FILE" 2>/dev/null || echo "0")
  if [[ "$VIDEO_SIZE" -lt 10000 && "$FORCE" = false ]]; then
    echo "Error: $VIDEO_FILE appears corrupted or empty ($VIDEO_SIZE bytes)." >&2
    echo "Use --force to override." >&2
    exit 1
  fi
fi

# Ensure poster frame exists if video exists
if [[ -f "$VIDEO_FILE" && ! -f "$POSTER_FILE" ]]; then
  if command -v ffmpeg >/dev/null 2>&1; then
    echo "Extracting missing poster frame to $POSTER_FILE..."
    if [[ "$DRY_RUN" = false ]]; then
      ffmpeg -y -ss 2.0 -i "$VIDEO_FILE" -frames:v 1 -q:v 2 "$POSTER_FILE" >/dev/null 2>&1 || true
    else
      echo "[dry-run] Would extract poster frame from $VIDEO_FILE"
    fi
  fi
fi

# Collect items to remove
ITEMS_TO_REMOVE=()

if [[ "$KEEP_COMPOSITION" = false && -d "$TARGET_DIR/composition" ]]; then
  ITEMS_TO_REMOVE+=("$TARGET_DIR/composition")
fi

if [[ "$KEEP_PLAN" = false ]]; then
  [[ -f "$TARGET_DIR/brag-plan.md" ]] && ITEMS_TO_REMOVE+=("$TARGET_DIR/brag-plan.md")
  [[ -f "$TARGET_DIR/composition-brief.md" ]] && ITEMS_TO_REMOVE+=("$TARGET_DIR/composition-brief.md")
fi

# Temporary files
while IFS= read -r -d '' temp_file; do
  ITEMS_TO_REMOVE+=("$temp_file")
done < <(find "$TARGET_DIR" -maxdepth 1 -type f \( -name "*.poster.mp4" -o -name "test*.jpg" -o -name "frame_*.jpg" \) -print0 2>/dev/null || true)

if [[ ${#ITEMS_TO_REMOVE[@]} -eq 0 ]]; then
  echo "Nothing to clean up in $TARGET_DIR."
  exit 0
fi

# Calculate size before cleanup
TOTAL_BYTES=0
for item in "${ITEMS_TO_REMOVE[@]}"; do
  if [[ -e "$item" ]]; then
    ITEM_BYTES=$(du -sk "$item" | cut -f1 || echo "0")
    TOTAL_BYTES=$((TOTAL_BYTES + ITEM_BYTES))
  fi
done
TOTAL_MB=$(awk "BEGIN {printf \"%.2f\", $TOTAL_BYTES / 1024}")

echo ""
if [[ "$DRY_RUN" = true ]]; then
  echo "=== [DRY RUN] Files to be removed (~${TOTAL_MB} MB) ==="
  for item in "${ITEMS_TO_REMOVE[@]}"; do
    echo "  - $item"
  done
  echo ""
  echo "No files were deleted."
  exit 0
fi

echo "=== Removing intermediate files (~${TOTAL_MB} MB) ==="
for item in "${ITEMS_TO_REMOVE[@]}"; do
  echo "  Removing: $item"
  rm -rf "$item"
done

echo ""
echo "=== Cleanup Complete ==="
echo "Retained Deliverables:"
[[ -f "$TARGET_DIR/brag.mp4" ]] && ls -lh "$TARGET_DIR/brag.mp4" | awk '{print "  ✓ Video:      " $9 " (" $5 ")"}'
[[ -f "$TARGET_DIR/brag.jpg" ]] && ls -lh "$TARGET_DIR/brag.jpg" | awk '{print "  ✓ Thumbnail:  " $9 " (" $5 ")"}'
[[ -f "$TARGET_DIR/share-copy.txt" ]] && ls -lh "$TARGET_DIR/share-copy.txt" | awk '{print "  ✓ Caption:    " $9 " (" $5 ")"}'
[[ -f "$TARGET_DIR/share-copy-variants.md" ]] && ls -lh "$TARGET_DIR/share-copy-variants.md" | awk '{print "  ✓ Variants:   " $9 " (" $5 ")"}'

echo ""
echo "Reclaimed approximately ${TOTAL_MB} MB of disk space."
