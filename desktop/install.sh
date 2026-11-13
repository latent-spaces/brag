#!/usr/bin/env bash
# Installs a launcher + app-menu entry for brag-desktop (user-level, no sudo).
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
chmod +x "$DIR/bin/brag-desktop" "$DIR/server.js"
mkdir -p ~/.local/bin ~/.local/share/applications
ln -sf "$DIR/bin/brag-desktop" ~/.local/bin/brag-desktop
cat > ~/.local/share/applications/brag-desktop.desktop <<EOF
[Desktop Entry]
Type=Application
Name=brag
Comment=Turn a project into a launch video with Claude Code
Exec=$HOME/.local/bin/brag-desktop
Icon=camera-video
Terminal=false
Categories=AudioVideo;Video;
StartupWMClass=brag-desktop
EOF
update-desktop-database ~/.local/share/applications 2>/dev/null || true
echo "Installed. Launch 'brag' from the app menu, or run: brag-desktop"
