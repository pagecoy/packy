#!/bin/bash
set -e

npm run build
chmod +x dist/index.js
npm link