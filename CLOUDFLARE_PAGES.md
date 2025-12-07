# Cloudflare Pages Deployment Guide

## Configuration

In your Cloudflare Pages dashboard, configure:

1. **Build command:** `npm run pages:build`
2. **Build output directory:** `web-build`
3. **Root directory:** `/` (project root)
4. **Deploy command:** (leave empty - Pages handles deployment automatically)

## Environment Variables

Add these in Cloudflare Pages dashboard:

- **RUBY_VERSION:** (leave empty/blank) - Ruby is not needed for web builds
- **NODE_VERSION:** `22.16.0` (optional, `.nvmrc` handles this automatically)

## Build Process

1. Cloudflare Pages will run `npm run pages:build`
2. This runs `npm run web:build` which executes webpack
3. Webpack outputs to `web-build/` directory
4. The `_redirects` file is automatically copied for SPA routing
5. Cloudflare Pages automatically deploys the `web-build/` directory

## SPA Routing

The `_redirects` file in `web-build/` ensures all routes are handled by the React app for client-side routing.

