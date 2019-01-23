'use strict'

const access = require('./helpers/access')
const fs = require('fs-extra')
const { spawn } = require('electron-installer-common')

describe('cli', function () {
  this.timeout(90000)

  describe('with an app with asar', function (test) {
    var dest = 'test/fixtures/out/foo/'

    before(() => spawn('./src/cli.js', [
      '--src', 'test/fixtures/app-with-asar/',
      '--dest', dest,
      '--arch', 'ia32'
    ]))

    after(() => fs.remove(dest))

    it('generates a `.flatpak` package', () => access(`${dest}org.unindented.footest_master_ia32.flatpak`))
  })

  describe('with an app without asar', function (test) {
    var dest = 'test/fixtures/out/bar/'

    before(() => spawn('./src/cli.js', [
      '--src', 'test/fixtures/app-without-asar/',
      '--dest', dest,
      '--arch', 'x64'
    ]))

    it('generates a `.flatpak` package', () => access(`${dest}com.foo.bartest_master_x64.flatpak`))
  })
})
