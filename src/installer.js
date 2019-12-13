'use strict'

const _ = require('lodash')
const childProcess = require('child_process')
const common = require('electron-installer-common')
const debug = require('debug')
const flatpak = require('@malept/flatpak-bundler')
const { getAppID } = require('./getappid')
const path = require('path')
const { promisify } = require('util')
const semver = require('semver')

const exec = promisify(childProcess.exec)

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

  get resourcesDir () {
    return path.resolve(__dirname, '../resources')
  }

  async createBinWrapper () {
    await this.createTemplatedFile(path.join(this.resourcesDir, 'electron-wrapper.ejs'), path.join(this.stagingDir, this.baseAppDir, 'bin', 'electron-wrapper'), 0o755)
  }

  async determineBaseRuntimeAndSDK () {
    const baseConfig = {
      branch: 'stable',
      baseVersion: 'stable',
      runtime: 'org.freedesktop.Platform',
      runtimeVersion: '19.08',
      sdk: 'org.freedesktop.Sdk'
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
        '--filesystem=/tmp',
        // Allow communication with network
        '--share=network',
        // System notifications with libnotify
        '--talk-name=org.freedesktop.Notifications'
      ],
      modules: [{
        name: 'zypak',
        sources: [
          {
            type: 'git',
            url: 'https://github.com/refi64/zypak',
            tag: 'v2019.11beta.3'
          }
        ]
      }],

      icon: path.resolve(__dirname, '../resources/icon.png'),
      files: [],
      symlinks: []
    }

    return this.defaults
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

    const flatpakBundlerVersion = (await exec('flatpak-builder --version')).toString().split(' ', 2)[1]

    if (flatpakBundlerVersion.split('.').map(part => Number(part)) >= [0, 9, 9]) {
      this.options.extraFlatpakBuilderArgs.push('--assumeyes')
    }

    const files = [
      [this.stagingDir, '/']
    ]
    const symlinks = [
      [path.join('/lib', this.appIdentifier, this.options.bin), path.join('/bin', this.options.bin)]
    ]

    return flatpak.bundle({
      id: this.options.id,
      branch: this.options.branch,
      base: this.options.base,
      baseVersion: this.options.baseVersion,
      baseFlatpakref: this.options.baseFlatpakref,
      extraFlatpakBuilderArgs: this.options.extraFlatpakBuilderArgs,
      runtime: this.options.runtime,
      runtimeVersion: this.options.runtimeVersion,
      runtimeFlatpakref: this.options.runtimeFlatpakref,
      sdk: this.options.sdk,
      sdkFlatpakref: this.options.sdkFlatpakref,
      finishArgs: this.options.finishArgs,
      command: 'electron-wrapper',
      files: files.concat(this.options.files),
      symlinks: symlinks.concat(this.options.symlinks),
      extraExports: extraExports,
      modules: this.options.modules
    }, {
      arch: this.options.arch,
      bundlePath: dest
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
