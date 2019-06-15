# `@malept/electron-installer-flatpak` - Changes by Version

## [Unreleased]

[Unreleased]: https://github.com/malept/electron-installer-flatpak/compare/v0.10.0...master

## [0.10.0] - 2019-06-15

[0.10.0]: https://github.com/malept/electron-installer-flatpak/compare/v0.9.0...v0.10.0

### Added

* Support for Electron >= 2.0 (malept#6)

### Removed

* Node &lt; 8 support (malept#5)

## [0.9.0] - 2019-03-13

[0.9.0]: https://github.com/malept/electron-installer-flatpak/compare/v0.8.0...v0.9.0

### Added

* Support for custom `flatpak-builder` args (malept#4)

### Fixed

* Append `--assumeyes` to the `flatpak-builder` arguments when `flatpak-builder` is new enough, to
  fix a bug with auto-installing flatpak dependencies (malept#4)

### Removed

* Node &lt; 6 support (malept#1)

----

For versions prior to 0.9.0, please see `git log`.
