# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Homebrew formula for easy installation on macOS/Linux (`brew tap asachs01/proxmux && brew install proxmux`)
- Quick install script (`curl -fsSL .../install.sh | bash`)
- GitHub Actions workflow for automated binary releases
- Pre-built binaries for multiple platforms:
  - macOS (Apple Silicon and Intel)
  - Linux (x64 and ARM64)
  - Windows (x64)

### Fixed
- Removed circular dependency in package.json (proxmux was listing itself as a dependency)

### Changed
- Updated README with comprehensive installation options
- Removed Bun requirement from README prerequisites (pre-built binaries don't require Bun)

## [0.2.0] - 2024-12-31

### Added
- Tabbed detail view with Options tab and action mode
- Cross-platform binary build scripts

## [0.1.0] - Initial Release

### Added
- Dashboard with cluster overview (CPU, memory, disk usage)
- VM management (list, start, stop, reboot)
- Container management (list, start, stop, reboot)
- Console access via SSH (`pct console`)
- Storage view
- Detail view for VMs/containers
- Vim-style navigation (j/k keys)
- Responsive terminal UI
- Configuration via file or environment variables

[Unreleased]: https://github.com/asachs01/proxmux/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/asachs01/proxmux/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/asachs01/proxmux/releases/tag/v0.1.0
