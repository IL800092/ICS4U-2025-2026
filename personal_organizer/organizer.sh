
#!/usr/bin/env bash
# ---------------------------------------------
# Personal Organizer (Bash) - with readline input
# Works in Git Bash on Windows and macOS/Linux
# Folder layout: $HOME/personal_organizer/<project>/notes.txt
# ---------------------------------------------
set -u  # avoid unset variables
ROOT="$HOME/personal_organizer"
ensure_root() {
  mkdir -p "$ROOT"
}
pause() {
  printf "\nPress Enter to continue..."
  read -e -r _
}
clear_screen() {
  clear
}
# Robust project lister for Git Bash/macOS/Linux
show_projects() {
  ensure_root
  local found=0
  shopt -s nullglob
  for d in "$ROOT"/*/; do
    [ -d "$d" ] || continue
    printf " - %s\n" "$(basename "$d")"
    found=1
  done
  shopt -u nullglob
  if [[ $found -eq 0 ]]; then
    echo " (none yet)"
  fi
}
# Same as above, but prints to stderr (so user sees it, not captured)
show_projects_stderr() {
  ensure_root
  local found=0
  shopt -s nullglob
  for d in "$ROOT"/*/; do
    [ -d "$d" ] || continue
    printf " - %s\n" "$(basename "$d")" >&2
    found=1
  done
  shopt -u nullglob
  if [[ $found -eq 0 ]]; then
    echo " (none yet)" >&2
  fi
}
list_projects() {
  echo "Projects:"
  show_projects
}
create_project() {
  ensure_root
  printf "Enter new project name: "
  read -e -r proj
  if [[ -z "$proj" ]]; then
    echo "Project name cannot be empty."
    return
  fi
  if [[ -e "$ROOT/$proj" ]]; then
    echo "Project '$proj' already exists."
    return
  fi
  mkdir -p "$ROOT/$proj"
  echo "Created: $ROOT/$proj"
}
# Select a project safely (list to stderr, capture only the response)
select_project() {
  ensure_root
  echo "Available projects:" >&2
  show_projects_stderr
  printf "Select a project: " >&2
  read -e -r proj
  echo "$proj"
}
add_note() {
  ensure_root
  local proj
  proj=$(select_project)
  if [[ -z "$proj" || ! -d "$ROOT/$proj" ]]; then
    echo "Project not found."
    return
  fi
  local notes="$ROOT/$proj/notes.txt"
  printf "Enter your note (single line). Tip: include keywords you might search later.\n> "
  read -e -r note
  if [[ -z "$note" ]]; then
    echo "Note cannot be empty."
    return
  fi
  local ts
  ts=$(date +"%Y-%m-%d %H:%M:%S")
  printf "[%s] %s\n" "$ts" "$note" >> "$notes"
  echo "Note added to project '$proj'."
  echo "Saved in: $notes"
}
view_notes() {
  ensure_root
  local proj
  proj=$(select_project)
  if [[ -z "$proj" || ! -d "$ROOT/$proj" ]]; then
    echo "Project not found."
    return
  fi
  local notes="$ROOT/$proj/notes.txt"
  if [[ -f "$notes" ]]; then
    echo "----- Notes for '$proj' -----"
    cat "$notes"
    echo "-----------------------------"
  else
    echo "No notes found for '$proj'."
  fi
}
search_notes() {
  ensure_root
  local proj
  proj=$(select_project)
  if [[ -z "$proj" || ! -d "$ROOT/$proj" ]]; then
    echo "Project not found."
    return
  fi
  local notes="$ROOT/$proj/notes.txt"
  if [[ ! -f "$notes" ]]; then
    echo "No notes found for '$proj'."
    return
  fi
  echo
  echo "Search modes:"
  echo " 1) Simple keyword (case-sensitive)"
  echo " 2) Keyword (ignore case)"
  echo " 3) Regular expression (extended)"
  echo
  printf "Choose search mode: "
  read -e -r mode
  echo
  case "$mode" in
    1)
      printf "Enter keyword: "
      read -e -r kw
      echo
      echo "Matches (case-sensitive):"
      grep -n -- "$kw" "$notes" || echo "(no matches)"
      ;;
    2)
      printf "Enter keyword: "
      read -e -r kw
      echo
      echo "Matches (ignore case):"
      grep -ni -- "$kw" "$notes" || echo "(no matches)"
      ;;
    3)
      echo "Enter an extended regex pattern."
      echo "Examples:"
      echo "  Dates (YYYY-MM-DD):      [0-9]{4}-[0-9]{2}-[0-9]{2}"
      echo "  Phone (123-456-7890):    [0-9]{3}-[0-9]{3}-[0-9]{4}"
      echo "  Postal code:             [A-Z][0-9][A-Z] ?[0-9][A-Z][0-9]"
      echo
      printf "Pattern: "
      read -e -r pattern
      echo
      echo "Regex matches:"
      grep -En -- "$pattern" "$notes" || echo "(no matches)"
      ;;
    *)
      echo "Invalid choice."
      ;;
  esac
}
archive_notes() {
  ensure_root
  local proj
  proj=$(select_project)
  if [[ -z "$proj" || ! -d "$ROOT/$proj" ]]; then
    echo "Project not found."
    return
  fi
  local notes="$ROOT/$proj/notes.txt"
  if [[ ! -f "$notes" ]]; then
    echo "No notes to archive for '$proj'."
    return
  fi
  local stamp
  stamp=$(date +%Y%m%d_%H%M%S)
  local archive="$ROOT/$proj/notes_${stamp}.tar.gz"
  tar -czf "$archive" -C "$ROOT/$proj" "notes.txt"
  : > "$notes"
  echo "Notes archived to: $archive"
  echo "notes.txt cleared (ready for new notes)."
}
main_menu() {
  ensure_root
  while true; do
    clear_screen
    echo "-----------------------------------"
    echo " Personal Organizer"
    echo " Root: $ROOT"
    echo "-----------------------------------"
    echo "1) Create a new project"
    echo "2) Add a note"
    echo "3) View notes"
    echo "4) Search notes (keyword or regex)"
    echo "5) Archive notes"
    echo "6) List projects"
    echo "7) Exit"
    echo "-----------------------------------"
    printf "Choose an option: "
    read -e -r opt
    echo
    case "$opt" in
      1) create_project; pause ;;
      2) add_note; pause ;;
      3) view_notes; pause ;;
      4) search_notes; pause ;;
      5) archive_notes; pause ;;
      6) list_projects; pause ;;
      7) echo "Goodbye."; exit 0 ;;
      *) echo "Invalid option."; pause ;;
    esac
  done
}
main_menu
