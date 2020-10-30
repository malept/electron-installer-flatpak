'use strict'

const { omit } = require('lodash')
const yargs = require('yargs')

const installer = require('./installer')
const { description, version } = require('../package.json')

module.exports = {
  parseArgs: function parseArgs (args) {
    return yargs
      .version(version)
      .usage(`${description}\n\nUsage: $0 --src <inputdir> --dest <outputdir> --arch <architecture> [...]`)
      .option('src', {
        describe: 'Directory that contains your built Electron app (e.g. with `electron-packager`)',
        demand: true
      })
      .option('dest', {
        describe: 'Directory that will contain the resulting Flatpak',
        demand: true
      })
      .option('arch', {
        describe: 'Target machine architecture for the package',
        demand: true
      })
      .option('config', {
        describe: 'JSON file that contains the metadata for your application',
        config: true
      })
      .example('$0 --src dist/app/ --dest dist/installer/ --arch ia32', 'use metadata from `dist/app/`')
      .example('$0 --src dist/app/ --dest dist/installer/ --config config.json', 'use metadata from `config.json`')
      .wrap(null)
      .parse(args)
  },
  run: async function run (args) {
    const argv = module.exports.parseArgs()

    console.log('Creating package (this may take a while)')

    const options = omit(argv, ['$0', '_', 'version'])
    await installer(options)
    console.log(`Successfully created package at ${argv.dest}`)
  }
}
