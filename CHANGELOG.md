# Changelog

All notable changes in this project will be documented in this file.

## [1.0.0-beta.2] - 2026-6-14
### Added
- New `-m` / `--map-only` flag to generate directory trees without source file contents.

### Fixed
- Resolved a critical scoping issue where nested `.gitignore` files in subdirectories (e.g., `backend/`) were ignored by both the tree compiler and file scraper.

## [1.0.0-beta.1] (was mistakenly labeled as 1.0.0) - 2026-06-12
- Inital beta release of Packy