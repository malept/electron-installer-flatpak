'use strict'

const assert = require('assert')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const fs = require('fs-extra')
const installer = require('..')

chai.use(chaiAsPromised)

describe('module', function () {
  this.timeout(90000)

  describe('with an app with asar', () => {
    const dest = 'test/fixtures/out/foo/bar/'
    const expectedFlatpak = `${dest}org.unindented.footest_stable_ia32.flatpak`

    before(async () => installer({
      src: 'test/fixtures/app-with-asar/',
      dest: dest,

      options: {
        arch: 'ia32'
      }
    }))

    after(async () => fs.remove(dest))

    it('generates a `.flatpak` package', async () => assert.ok(await fs.pathExists(expectedFlatpak), `${expectedFlatpak} not created`))
  })

  describe('with an app without asar', () => {
    const dest = 'test/fixtures/out/bar/'
    const expectedFlatpak = `${dest}com.foo.bartest_stable_x64.flatpak`

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

    it('generates a `.flatpak` package', async () => assert.ok(await fs.pathExists(expectedFlatpak), `${expectedFlatpak} not created`))
  })

  describe('with an invalid homepage', () => {
    it('throws a human readable exception', () => chai.assert.isRejected(installer({
      src: 'test/fixtures/invalid-homepage',
      dest: 'test/fixtures/out/foo'
    }), /^Could not parse the homepage/))
  })
})
