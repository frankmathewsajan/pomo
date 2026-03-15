#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PACKAGE_JSON="package.json"
PACKAGE_LOCK_JSON="package-lock.json"
TAURI_CONF="src-tauri/tauri.conf.json"
CARGO_TOML="src-tauri/Cargo.toml"

read_package_version() {
  bun -e 'import { readFileSync } from "node:fs"; const p = JSON.parse(readFileSync("package.json", "utf8")); console.log(p.version);'
}

bump_semver() {
  local version="$1"
  local part="$2"

  if [[ ! "$version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    echo "Error: current version '$version' is not semver (x.y.z)." >&2
    exit 1
  fi

  local major="${BASH_REMATCH[1]}"
  local minor="${BASH_REMATCH[2]}"
  local patch="${BASH_REMATCH[3]}"

  case "$part" in
    patch)
      patch=$((patch + 1))
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    *)
      echo "Error: unsupported bump type '$part'." >&2
      exit 1
      ;;
  esac

  echo "${major}.${minor}.${patch}"
}

sync_versions() {
  local new_version="$1"
  export NEW_VERSION="$new_version"

  bun -e '
    import { existsSync, readFileSync, writeFileSync } from "node:fs";

    const version = process.env.NEW_VERSION;
    if (!version) {
      console.error("NEW_VERSION env var is required");
      process.exit(1);
    }

    const updateJsonVersion = (path, mutate) => {
      if (!existsSync(path)) return;
      const data = JSON.parse(readFileSync(path, "utf8"));
      mutate(data);
      writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
    };

    updateJsonVersion("package.json", (data) => {
      data.version = version;
    });

    updateJsonVersion("package-lock.json", (data) => {
      data.version = version;
      if (data.packages && data.packages[""]) {
        data.packages[""].version = version;
      }
    });

    updateJsonVersion("src-tauri/tauri.conf.json", (data) => {
      data.version = version;
    });
  '

  perl -0777 -i -pe 's/(\[package\][\s\S]*?^version\s*=\s*")[^"]+("\s*$)/$1.$ENV{NEW_VERSION}.$2/m' "$CARGO_TOML"
}

current_version="$(read_package_version)"
echo "Current version is ${current_version}"

read -rp "Do you want to update the version before releasing? (y/N): " update_version
if [[ "$update_version" =~ ^[yY]$ ]]; then
  read -rp "Enter 'patch', 'minor', 'major', or a specific version (e.g. 0.9.1) [default: patch]: " bump_choice
  bump_choice="${bump_choice:-patch}"

  if [[ "$bump_choice" =~ ^(patch|minor|major)$ ]]; then
    new_version="$(bump_semver "$current_version" "$bump_choice")"
  else
    new_version="$bump_choice"
    if [[ ! "$new_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
      echo "Error: version must be semver (x.y.z)." >&2
      exit 1
    fi
  fi

  echo "Syncing version ${new_version} across package and Tauri files..."
  sync_versions "$new_version"
  version="$new_version"
else
  version="$current_version"
fi

tag_name="v${version}"
echo "Releasing ${tag_name}..."

echo "Building Linux bundles (deb, rpm, appimage)..."
bun run tauri build -- --bundles deb,rpm,appimage

echo "Creating and pushing git tag ${tag_name}..."
if git tag "$tag_name"; then
  git push origin "$tag_name"
else
  echo "Warning: failed to create tag '${tag_name}'. It may already exist." >&2
fi

bundle_dir="src-tauri/target/release/bundle"
mapfile -t files_to_upload < <(find "$bundle_dir" -type f \( -name "*.deb" -o -name "*.rpm" -o -name "*.AppImage" -o -name "*.appimage" \) | sort)

if [[ ${#files_to_upload[@]} -eq 0 ]]; then
  echo "No Linux build artifacts found to upload." >&2
  exit 1
fi

echo "Creating GitHub Release and uploading artifacts..."
gh release create "$tag_name" "${files_to_upload[@]}" --title "Release ${tag_name}" --generate-notes

echo "Done."