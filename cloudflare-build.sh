#!/bin/bash
# Cloudflare Pages build script
# This script ensures Ruby dependencies are handled correctly

# Skip Ruby installation if not needed (uncomment to skip)
# export SKIP_RUBY=true

# Run the web build
npm run web:build

