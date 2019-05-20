'use strict'

const access = require('./helpers/access')
const fs = require('fs-extra')
const installer = require('..')

describe('module', function () {
  this.timeout(90000)

  describe('with an app with asar', () => {
    const dest = 'test/fixtures/out/foo/bar/'

    before(async () => installer({
      src: 'test/fixtures/app-with-asar/',
      dest: dest,

      options: {
        arch: 'ia32'
      }
    }))

    after(async () => fs.remove(dest))

    it('generates a `.flatpak` package', async () => access(`${dest}org.unindented.footest_master_ia32.flatpak`))
  })

  describe('with an app without asar', () => {
    const dest = 'test/fixtures/out/bar/'

    before(async () => installer({
      src: 'test/fixtures/app-without-asar/',
      dest: dest,

      options: {
        icon: {
          '256x256': 'test/fixtures/icon.png'
        },
        bin: 'resources/cli/bar.sh',
        section: 'devel',
        priority: 'optional',
        arch: 'x64'
      }
    }))

    after(async () => fs.remove(dest))

    it('generates a `.flatpak` package', async () => access(`${dest}com.foo.bartest_master_x64.flatpak`))
  })
})
