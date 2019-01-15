'use strict'

const _ = require('lodash')
const common = require('electron-installer-common')
const debug = require('debug')
const flatpak = require('flatpak-bundler')
const path = require('path')
const pify = require('pify')
const url = require('url')

const defaultLogger = debug('electron-installer-flatpak')

const defaultRename = (dest, src) => {
  return path.join(dest, src)
}

function sanitizePackageNameParts (parts) {
  return parts.map(part => part.replace(/[^a-z0-9]/gi, '_').replace(/^[0-9]/, '_$&'))
}

function getAppID (name, website) {
  let host = 'electron.atom.io'
  if (website) {
    const urlObject = new url.URL(website)
    if (urlObject.host) {
      host = urlObject.host
    }
  }
  let parts = host.split('.')
  if (parts[0] === 'www') {
    parts.shift()
  }
  parts = sanitizePackageNameParts(parts.reverse())
  parts.push(name)
  let appID = parts.join('.')
  while (appID.length > 255) {
    parts.unshift()
    appID = parts.join('.')
  }
  return appID
}

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
      'createCopyright',
      'createDesktopFile'
    ]
  }

  get defaultDesktopTemplatePath () {
    return path.resolve(__dirname, '../resources/desktop.ejs')
  }

  /**
   * Generate the hash of default options for the installer. Some come from the info
   * read from `package.json`, and some are hardcoded.
   */
  generateDefaults () {
    return common.readMeta(this.userSupplied)
      .then(pkg => {
        pkg = pkg || {}

        this.defaults = {
          id: getAppID(pkg.name, pkg.homepage),
          productName: pkg.productName || pkg.name,
          genericName: pkg.genericName || pkg.productName || pkg.name,
          description: pkg.description,

          branch: 'master',
          arch: undefined,

          base: 'io.atom.electron.BaseApp',
          baseVersion: 'master',
          baseFlatpakref: 'https://s3-us-west-2.amazonaws.com/electron-flatpak.endlessm.com/electron-base-app-master.flatpakref',
          runtime: 'org.freedesktop.Platform',
          runtimeVersion: '1.4',
          runtimeFlatpakref: 'https://raw.githubusercontent.com/endlessm/flatpak-bundler/master/refs/freedesktop-runtime-1.4.flatpakref',
          sdk: 'org.freedesktop.Sdk',
          sdkFlatpakref: 'https://raw.githubusercontent.com/endlessm/flatpak-bundler/master/refs/freedesktop-sdk-1.4.flatpakref',
          finishArgs: [
            // X Rendering
            '--socket=x11', '--share=ipc',
            // Open GL
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
          modules: [],

          bin: pkg.productName || pkg.name || 'electron',
          icon: path.resolve(__dirname, '../resources/icon.png'),
          files: [],
          symlinks: [],

          categories: [
            'GNOME',
            'GTK',
            'Utility'
          ],

          mimeType: []
        }

        return this.defaults
      })
  }

  /**
   * Bundle everything using `flatpak-bundler`.
   */
  createBundle () {
    const name = `${this.options.id}_${this.options.branch}_${this.options.arch}.flatpak`
    const dest = this.options.rename(this.options.dest, name)
    this.options.logger('Creating package at ' + dest)
    const extraExports = []
    if (this.options.icon && !_.isObject(this.options.icon)) {
      extraExports.push(this.pixmapIconPath)
    }

    const files = [
      [this.stagingDir, '/']
    ]
    const symlinks = [
      [path.join('/lib', this.options.id, this.options.bin), path.join('/bin', this.options.bin)]
    ]

    return pify(flatpak.bundle)({
      id: this.options.id,
      branch: this.options.branch,
      base: this.options.base,
      baseVersion: this.options.baseVersion,
      baseFlatpakref: this.options.baseFlatpakref,
      runtime: this.options.runtime,
      runtimeVersion: this.options.runtimeVersion,
      runtimeFlatpakref: this.options.runtimeFlatpakref,
      sdk: this.options.sdk,
      sdkFlatpakref: this.options.sdkFlatpakref,
      finishArgs: this.options.finishArgs,
      command: this.options.bin,
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

module.exports = function (data, callback) {
  data.rename = data.rename || defaultRename
  data.logger = data.logger || defaultLogger

  const installer = new FlatpakInstaller(data)

  return installer.generateDefaults()
    .then(() => installer.generateOptions())
    .then(() => data.logger(`Creating package with options\n${JSON.stringify(installer.options, null, 2)}`))
    .then(() => installer.createStagingDir())
    .then(() => installer.createContents())
    .then(() => installer.createBundle())
    .then(() => {
      data.logger(`Successfully created package at ${installer.options.dest}`)
      return installer.options
    }).catch(err => {
      data.logger(common.errorMessage('creating package', err))
      throw err
    })
}

module.exports.Installer = FlatpakInstaller
