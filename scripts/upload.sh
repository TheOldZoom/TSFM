#!/usr/bin/env bash

set -e

BUMP="${1:-patch}"

echo "Building TSFM..."
bun run build

echo "Bumping version..."
npm version "$BUMP" --no-git-tag-version

echo "Publishing to npm..."
npm publish

echo "Published successfully!"
