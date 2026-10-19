#!/usr/bin/env bash
# ==============================================================================
# AndroLua+ Package (.alp) Builder
# ==============================================================================
# Builds and packages any AndroLua+ project into a .alp package cleanly.
# Supports:
#   - Interactive prompt with manual entry or auto-suggested defaults
#   - Direct argument passing (e.g. ./build.sh spider or ./build.sh custom)
#   - Drag-and-dropped folder paths (auto-strips quotes and whitespace)
#   - Can be run from any working directory (e.g. root or inside control-web)
#   - Full Lua and ALY syntax validation before packaging
# ==============================================================================

set -eo pipefail

# ANSI Colors
BOLD="\033[1m"
GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
RESET="\033[0m"

# Print banner
echo -e "${CYAN}${BOLD}=============================================================${RESET}"
echo -e "${CYAN}${BOLD}             AndroLua+ (.alp) Package Builder               ${RESET}"
echo -e "${CYAN}${BOLD}=============================================================${RESET}"

# Find workspace root directory (whether run from root or from control-web)
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$DIR/spider" ] || [ -f "$DIR/ext.sh" ]; then
  ROOT_DIR="$DIR"
elif [ -d "$DIR/../spider" ] || [ -f "$DIR/../ext.sh" ]; then
  ROOT_DIR="$(cd "$DIR/.." && pwd)"
else
  ROOT_DIR="/home/rahul/Desktop/tg hack"
fi

# Function to clean and sanitize input path
clean_input_path() {
  local raw="$1"
  raw="${raw#"${raw%%[![:space:]]*}"}"
  raw="${raw%"${raw##*[![:space:]]}"}"
  if [[ "$raw" == \'*\' ]]; then raw="${raw:1:-1}"; fi
  if [[ "$raw" == \"*\" ]]; then raw="${raw:1:-1}"; fi
  if [[ "$raw" == ~* ]]; then raw="${HOME}${raw:1}"; fi
  echo "$raw"
}

# Scan for valid Lua project directories (folders with main.lua or init.lua)
PROJECT_NAMES=()
while IFS= read -r dir; do
  [ -z "$dir" ] && continue
  bname="$(basename "$dir")"
  if [ "$bname" != "control-web" ] && [ "$bname" != "lexxa" ] && [ "$dir" != "$ROOT_DIR" ]; then
    PROJECT_NAMES+=("$bname")
  fi
done < <(find "$ROOT_DIR" -maxdepth 2 -type f \( -name "main.lua" -o -name "init.lua" \) -exec dirname {} + 2>/dev/null | sort -u)

INPUT_TARGET="$1"

# Interactive prompt if no argument provided
if [ -z "$INPUT_TARGET" ]; then
  DEFAULT_PROJECT=""
  for p in "${PROJECT_NAMES[@]}"; do
    if [ "$p" == "spider" ]; then
      DEFAULT_PROJECT="spider"
      break
    fi
  done
  [ -z "$DEFAULT_PROJECT" ] && [ ${#PROJECT_NAMES[@]} -gt 0 ] && DEFAULT_PROJECT="${PROJECT_NAMES[0]}"
  [ -z "$DEFAULT_PROJECT" ] && DEFAULT_PROJECT="spider"

  if [ ${#PROJECT_NAMES[@]} -eq 1 ]; then
    echo -e "Found in workspace: ${GREEN}${BOLD}${PROJECT_NAMES[0]}${RESET}"
    read -r -p "Enter project folder / name [Press Enter for '${PROJECT_NAMES[0]}']: " USER_INPUT
    INPUT_TARGET="${USER_INPUT:-${PROJECT_NAMES[0]}}"
  elif [ ${#PROJECT_NAMES[@]} -gt 1 ]; then
    echo -e "Available Lua projects found in workspace:"
    for i in "${!PROJECT_NAMES[@]}"; do
      num=$((i + 1))
      name="${PROJECT_NAMES[$i]}"
      if [ "$name" == "$DEFAULT_PROJECT" ]; then
        echo -e "  [${CYAN}${num}${RESET}] ${GREEN}${BOLD}${name}${RESET} ${YELLOW}(default)${RESET}"
      else
        echo -e "  [${CYAN}${num}${RESET}] ${name}"
      fi
    done
    echo ""
    read -r -p "Select a number (1-${#PROJECT_NAMES[@]}) or enter project folder name [Press Enter for '${DEFAULT_PROJECT}']: " USER_INPUT
    INPUT_TARGET="${USER_INPUT:-$DEFAULT_PROJECT}"

    # If user selected a number
    if [[ "$INPUT_TARGET" =~ ^[0-9]+$ ]] && [ "$INPUT_TARGET" -ge 1 ] && [ "$INPUT_TARGET" -le ${#PROJECT_NAMES[@]} ]; then
      INPUT_TARGET="${PROJECT_NAMES[$((INPUT_TARGET - 1))]}"
    fi
  else
    read -r -p "Enter project folder / name [Press Enter for 'spider']: " USER_INPUT
    INPUT_TARGET="${USER_INPUT:-spider}"
  fi
fi

CLEAN_TARGET="$(clean_input_path "$INPUT_TARGET")"
CLEAN_TARGET="${CLEAN_TARGET%.alp}"

# Locate the source directory
SOURCE_DIR=""
if [ -d "$CLEAN_TARGET" ]; then
  SOURCE_DIR="$(cd "$CLEAN_TARGET" && pwd)"
elif [ -d "$ROOT_DIR/$CLEAN_TARGET" ]; then
  SOURCE_DIR="$ROOT_DIR/$CLEAN_TARGET"
elif [ -d "$ROOT_DIR/${CLEAN_TARGET}_extracted" ]; then
  SOURCE_DIR="$ROOT_DIR/${CLEAN_TARGET}_extracted"
elif [ -d "$(pwd)/$CLEAN_TARGET" ]; then
  SOURCE_DIR="$(pwd)/$CLEAN_TARGET"
fi

if [ -z "$SOURCE_DIR" ] || [ ! -d "$SOURCE_DIR" ]; then
  echo -e "${RED}Error: Cannot find directory for project: '${CLEAN_TARGET}'${RESET}"
  echo -e "Searched in: $ROOT_DIR/$CLEAN_TARGET"
  exit 1
fi

BASE_NAME="$(basename "$SOURCE_DIR")"
ALP_BASE_NAME="${BASE_NAME%_extracted}"
OUTPUT_ALP="$ROOT_DIR/${ALP_BASE_NAME}.alp"

echo ""
echo -e "[1/3] Processing Project:"
echo -e "  - Source:      ${CYAN}${SOURCE_DIR}${RESET}"
echo -e "  - Destination: ${GREEN}${OUTPUT_ALP}${RESET}"
echo ""

echo -e "[2/3] Validating Lua & ALY syntax..."
if command -v luac >/dev/null 2>&1; then
  [ -f "$SOURCE_DIR/init.lua" ] && luac -p "$SOURCE_DIR/init.lua"
  [ -f "$SOURCE_DIR/main.lua" ] && luac -p "$SOURCE_DIR/main.lua"
  [ -f "$SOURCE_DIR/login.lua" ] && luac -p "$SOURCE_DIR/login.lua"
  [ -f "$SOURCE_DIR/layout.aly" ] && luac -p <(echo "return " && cat "$SOURCE_DIR/layout.aly")
  [ -f "$SOURCE_DIR/floating.aly" ] && luac -p <(echo "return " && cat "$SOURCE_DIR/floating.aly")
  [ -f "$SOURCE_DIR/login_layout.aly" ] && luac -p <(echo "return " && cat "$SOURCE_DIR/login_layout.aly")
  echo -e "      ${GREEN}✓ All Lua and ALY files passed syntax validation!${RESET}"
else
  echo -e "      (luac not found, skipping syntax check)"
fi

echo ""
echo -e "[3/3] Packing project into ${ALP_BASE_NAME}.alp..."
rm -f "$OUTPUT_ALP"
(
  cd "$SOURCE_DIR"
  zip -9 -q -r "$OUTPUT_ALP" . -x "*.sh" -x ".*" -x "*.bak"
)

FILE_SIZE="$(ls -lh "$OUTPUT_ALP" | awk '{print $5}')"
echo -e "${GREEN}${BOLD}✓ Build Complete! Successfully generated ${ALP_BASE_NAME}.alp (${FILE_SIZE})${RESET}"
echo ""
echo -e "File ready at: ${CYAN}${OUTPUT_ALP}${RESET}"
echo -e "Import this .alp file into AndroLua+ on Android to install and run."
echo -e "${CYAN}${BOLD}=============================================================${RESET}"
