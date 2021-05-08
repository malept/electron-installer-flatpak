'use strict'

const _ = require('lodash')
const common = require('electron-installer-common')
const debug = require('debug')
const flatpak = require('@malept/flatpak-bundler')
const { getAppID } = require('./getappid')
const path = require('path')
const semver = require('semver')

const defaultLogger = debug('electron-installer-flatpak')
const defaultRename = (dest, src) => path.join(dest, src)

class FlatpakInstaller extends common.ElectronInstaller {
  get appIdentifier () {
    return this.options.id
  }

  get baseAppDir () {
    return ''
  }

  get contentFunctions () {
    return [
      'copyApplication',
      'copyLinuxIcons',
      'createBinWrapper',
      'createCopyright',
      'createDesktopFile'
    ]
  }

  get defaultDesktopTemplatePath () {
    return path.join(this.resourcesDir, 'desktop.ejs')
  }

  get flatpakrefs () {
    const arch = flatpak.translateArch(this.options.arch)
    return {
      baseFlatpakref: this.options.baseFlatpakref || `app/${this.options.base}/${arch}/${this.options.baseVersion}`,
      runtimeFlatpakref: this.options.runtimeFlatpakref || `runtime/${this.options.runtime}/${arch}/${this.options.runtimeVersion}`,
      sdkFlatpakref: this.options.sdkFlatpakref || `runtime/${this.options.sdk}/${arch}/${this.options.runtimeVersion}`
    }
  }

  get resourcesDir () {
    return path.resolve(__dirname, '../resources')
  }

  async createBinWrapper () {
    if (await this.requiresSandboxWrapper()) {
      await this.createTemplatedFile(path.join(this.resourcesDir, 'electron-wrapper.ejs'), path.join(this.stagingDir, this.baseAppDir, 'bin', 'electron-wrapper'), 0o755)
    }
  }

  async createDesktopFile () {
    this.options.desktopExec = (await this.requiresSandboxWrapper()) ? 'electron-wrapper' : this.options.bin
    await super.createDesktopFile()
  }

  async determineBaseRuntimeAndSDK () {
    const baseConfig = {
      branch: 'stable',
      baseVersion: 'stable',
      runtime: 'org.freedesktop.Platform',
      sdk: 'org.freedesktop.Sdk'
    }
    if (await this.requiresSandboxWrapper()) {
      baseConfig.runtimeVersion = '19.08'
    } else {
      baseConfig.runtimeVersion = '1.6'
    }
    if (semver.gte(await common.readElectronVersion(this.userSupplied.src), '2.0.0-beta.1')) {
      baseConfig.base = 'org.electronjs.Electron2.BaseApp'
    } else {
      baseConfig.base = 'io.atom.electron.BaseApp'
    }

    return baseConfig
  }

  /**
   * Generate the hash of default options for the installer. Some come from the info
   * read from `package.json`, and some are hardcoded.
   */
  async generateDefaults () {
    const pkg = (await common.readMetadata(this.userSupplied)) || {}
    const modules = []
    if (await this.requiresSandboxWrapper()) {
      modules.push({
        name: 'zypak',
        sources: [
          {
            type: 'git',
            url: 'https://github.com/refi64/zypak',
            tag: 'v2021.02'
          }
        ]
      })
    }
    this.defaults = {
      ...common.getDefaultsFromPackageJSON(pkg),
      ...(await this.determineBaseRuntimeAndSDK()),
      id: getAppID(pkg.name, common.getHomePage(pkg)),
      extraFlatpakBuilderArgs: [],
      finishArgs: [
        // X Rendering
        '--socket=x11', '--share=ipc',
        // OpenGL
        '--device=dri',
        // Audio output
        '--socket=pulseaudio',
        // Read/write home directory access
        '--filesystem=home',
        // Chromium uses a socket in tmp for its singleton check
        '--env=TMPDIR=/var/tmp',
        // Allow communication with network
        '--share=network',
        // System notifications with libnotify
        '--talk-name=org.freedesktop.Notifications'
      ],
      modules,

      icon: path.resolve(__dirname, '../resources/icon.png'),
      files: [],
      symlinks: []
    }

    return this.defaults
  }

  async requiresSandboxWrapper () {
    if (typeof this._requiresSandboxWrapper === 'undefined') {
      this._requiresSandboxWrapper = await common.hasSandboxHelper(this.sourceDir)
    }

    return this._requiresSandboxWrapper
  }

  /**
   * Bundle everything using `flatpak-bundler`.
   */
  async createBundle () {
    const name = `${this.appIdentifier}_${this.options.branch}_${this.options.arch}.flatpak`
    const dest = this.options.rename(this.options.dest, name)
    this.options.logger(`Creating package at ${dest}`)
    const extraExports = []
    if (this.options.icon && !_.isObject(this.options.icon)) {
      extraExports.push(this.pixmapIconPath)
    }

    const files = [
      [this.stagingDir, '/']
    ]
    const symlinks = [
      [path.join('/lib', this.appIdentifier, this.options.bin), path.join('/bin', this.options.bin)]
    ]

    const command = (await this.requiresSandboxWrapper()) ? 'electron-wrapper' : this.options.bin

    return flatpak.bundle({
      id: this.options.id,
      branch: this.options.branch,
      base: this.options.base,
      baseVersion: this.options.baseVersion.toString(),
      runtime: this.options.runtime,
      runtimeVersion: this.options.runtimeVersion.toString(),
      sdk: this.options.sdk,
      finishArgs: this.options.finishArgs,
      command,
      modules: this.options.modules
    }, {
      ...this.flatpakrefs,
      arch: this.options.arch,
      bundlePath: dest,
      extraExports: extraExports,
      extraFlatpakBuilderArgs: this.options.extraFlatpakBuilderArgs,
      files: files.concat(this.options.files),
      symlinks: symlinks.concat(this.options.symlinks)
    })
  }
}

/* ************************************************************************** */

module.exports = async data => {
  data.rename = data.rename || defaultRename
  data.logger = data.logger || defaultLogger

  const installer = new FlatpakInstaller(data)

  await installer.generateDefaults()
  await installer.generateOptions()
  data.logger(`Creating package with options\n${JSON.stringify(installer.options, null, 2)}`)
  await installer.createStagingDir()
  await installer.createContents()
  await installer.createBundle()
  data.logger(`Successfully created package at ${installer.options.dest}`)
  return installer.options
}

module.exports.Installer = FlatpakInstaller
