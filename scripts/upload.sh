#!/usr/bin/env bash

set -e

echo "Building TSFM..."
bun run build

echo "Bumping version..."
npm version patch --no-git-tag-version

echo "Publishing to npm..."
npm publish

echo "Published successfully!"
