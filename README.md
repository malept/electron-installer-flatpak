# @malept/electron-installer-flatpak [![npm (scoped)](https://img.shields.io/npm/v/@malept/electron-installer-flatpak.svg)](https://www.npmjs.com/package/@malept/electron-installer-flatpak) [![Build Status](https://img.shields.io/travis/malept/electron-installer-flatpak/master.svg)](http://travis-ci.org/malept/electron-installer-flatpak) [![codecov](https://codecov.io/gh/malept/electron-installer-flatpak/branch/master/graph/badge.svg)](https://codecov.io/gh/malept/electron-installer-flatpak)


Create a flatpak for your Electron app. This is based off the
[electron-installer-debian](https://github.com/unindented/electron-installer-debian)
tool. Add flatpak support to an electron app using [electron-packager](https://github.com/electron-userland/electron-packager)
with minimal configuration.

## Requirements

This tool requires `flatpak` and `flatpak-builder` >= 0.8.2 to be installed on
your system. See http://flatpak.org/getting.html . For Electron apps using
Electron 6 and above, [`elfutils`](https://sourceware.org/elfutils/) is required.

Building a flatpak for an Electron app requires installing a "base" flatpak
application with electron library dependencies. That base will be autoinstalled
during an app build.

Actually running the apps will require the freedesktop runtime to be installed.
If you already are running flatpak apps you may have the freedesktop runtime
installed. The following example will install the freedesktop runtime for both
i386 and x86_64.
```
flatpak --user remote-add ----if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak --user install gnome org.freedesktop.Platform/x86_64/1.6 org.freedesktop.Platform/i386/1.6
```

Apps using Electron 6 or above require a runtime version of 19.08 instead of 1.6.
Please note that as of 19.08, they have removed support for the i386 arch.

## Installation

For use from command-line:

```sh
$ npm install -g @malept/electron-installer-flatpak
```

For use in npm scripts or programmatically:

```sh
$ npm install --save-dev @malept/electron-installer-flatpak
```


## Usage

Say your Electron app lives in `path/to/app`, and has a structure like this:

```
.
├── LICENSE
├── README.md
├── node_modules
│   ├── electron-packager
│   └── electron
├── package.json
├── resources
│   ├── Icon.png
│   ├── IconTemplate.png
│   └── IconTemplate@2x.png
└── src
    ├── index.js
    ├── main
    │   └── index.js
    └── renderer
        ├── index.html
        └── index.js
```

You now run `electron-packager` to build the app for flatpak:

```
$ electron-packager . app --platform linux --arch x64 --out dist/
```

And you end up with something like this in your `dist` folder:

```
.
└── dist
    └── app-linux-x64
        ├── LICENSE
        ├── LICENSES.chromium.html
        ├── content_shell.pak
        ├── app
        ├── icudtl.dat
        ├── libgcrypt.so.11
        ├── libnode.so
        ├── locales
        ├── natives_blob.bin
        ├── resources
        ├── snapshot_blob.bin
        └── version
```

How do you turn that into a flatpak package that your users can install?

### Scripts

If you want to run `electron-installer-flatpak` through npm, install the package locally:

```
$ npm install --save-dev @malept/electron-installer-flatpak
```

Edit the `scripts` section of your `package.json`:

```json
{
  "name": "app",
  "description": "An awesome app!",
  "version": "0.0.1",
  "scripts": {
    "start": "electron .",
    "build:linux:x64": "electron-packager . --platform linux --arch x64 --out dist/",
    "build:flatpak:x64": "electron-installer-flatpak --src dist/app-linux-x64/ --dest dist/installers/ --arch x64"
  },
  "devDependencies": {
    "@malept/electron-installer-flatpak": "^0.10.1",
    "electron-packager": "^14.0.0",
    "electron": "^7.1.1"
  }
}
```

And run the script:

```
$ npm run build:flatpak:x64
```

You'll end up with the package at `dist/installer/io.atom.electron.app_master_x64.flatpak`.

### Programmatically

Install the package locally:

```
$ npm install --save-dev @malept/electron-installer-flatpak
```

An example of a script utilizing this module:

```javascript
const installer = require('@malept/electron-installer-flatpak')

const options = {
  src: 'dist/app-linux-x64/',
  dest: 'dist/installers/',
  arch: 'x64'
}

console.log('Creating package (this may take a while)')

installer(options)
  .then(() => console.log(`Successfully created package at ${options.dest}`))
  .catch(err => {
    console.error(err, err.stack)
    process.exit(1)
  })
```

You'll end up with the package at `dist/installers/io.atom.electron.app_master_x64.flatpak`.

### Command-Line

If you want to run `@malept/electron-installer-flatpak` straight from the command-line, install the package globally:

```
$ npm install -g @malept/electron-installer-flatpak
```

And point it to your built app:

```
$ electron-installer-flatpak --src dist/app-linux-x64/ --dest dist/installers/ --arch x64
```

You'll end up with the package at `dist/installers/io.atom.electron.app_master_x64.flatpak`.

### Options

Even though you can pass most of these options through the command-line interface, it may be easier to create a configuration file:

```json
{
  "dest": "dist/installers/",
  "icon": "resources/Icon.png",
  "categories": [
    "Utility"
  ]
}
```

And pass that instead with the `config` option:

```
$ electron-installer-flatpak --src dist/app-linux-x64/ --arch x64 --config config.json
```

#### src
Type: `String`
Default: `undefined`

Path to the folder that contains your built Electron application.

#### dest
Type: `String`
Default: `undefined`

Path to the folder that will contain your flatpak installer.

#### rename
Type: `Function`
Default: `function (dest, src) { return path.join(dest, src); }`

Function that renames all files generated by the task before putting them in your `dest` folder.

#### options.id
Type: `String`
Default: the inverted hostname of `package.homepage` plus the santized `package.name`, or `io.atom.electron`

App ID of the flatpak, used in the [`id` field of a flatpak-builder manifest](http://flatpak.org/flatpak/flatpak-docs.html#flatpak-builder) and the flatpak filename.

#### options.productName
Type: `String`
Default: `package.productName || package.name`

Name of the application (e.g. `Atom`), used in the [`Name` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).

#### options.genericName
Type: `String`
Default: `package.genericName || package.productName || package.name`

Generic name of the application (e.g. `Text Editor`), used in the [`GenericName` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).

#### options.description
Type: `String`
Default: `package.description`

Short description of the application, used in the [`Comment` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).

#### options.branch
Type: `String`
Default: `master`

Release branch of the flatpak, used in the [`branch` field of a flatpak-builder manifest](http://flatpak.org/flatpak/flatpak-docs.html#flatpak-builder) and the flatpak filename, after the sanitized [app ID](#optionsid).

#### options.base
Type: `String`
Default: `io.atom.electron.BaseApp` for Electron &lt; 2, `org.electronjs.Electron2.BaseApp` for Electron >= 2

Base app to use when building the flatpak, used in the [`base` field of a flatpak-builder manifest](http://flatpak.org/flatpak/flatpak-docs.html#flatpak-builder).

#### options.baseVersion
Type: `String`
Default: `master`

Base app version, used in the [`base-version` field of a flatpak-builder manifest](http://flatpak.org/flatpak/flatpak-docs.html#flatpak-builder).


#### options.baseFlatpakref
Type: `String`
Default: `undefined`

Url of a flatpakref to use to auto install the base application.

#### options.runtime
Type: `String`
Default: `org.freedesktop.Platform`

Runtime id, used in the [`runtime` field of a flatpak-builder manifest](http://flatpak.org/flatpak/flatpak-docs.html#flatpak-builder).

#### options.runtimeVersion
Type: `String`
Default: `1.6` for Electron &lt; 5, `19.08` for Electron >= 5

Runtime version, used in the [`runtime-version` field of a flatpak-builder manifest](http://flatpak.org/flatpak/flatpak-docs.html#flatpak-builder).

#### options.sdk
Type: `String`
Default: `org.freedesktop.Sdk`

Sdk ID, used in the [`sdk` field of a flatpak-builder manifest](http://flatpak.org/flatpak/flatpak-docs.html#flatpak-builder).

#### options.arch
Type: `String`
Default: `undefined`

Machine architecture the package is targeted to. Suggested to use node style
arches here ('ia32', 'x64'), which will be converted to flatpak style arches
('i386', 'x86_64') when calling into the actual flatpak commands. Directly
using flatpak style arches is also supported.

#### options.finishArgs
Type: `Array[String]`
Default:
```javascript
[
  // X Rendering
  '--socket=x11', '--share=ipc',
  // Open GL
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
```

Arguments to use when call `flatpak build-finish`, use in the [`finish-args` field of a flatpak-builder manifest](http://flatpak.org/flatpak/flatpak-docs.html#flatpak-builder).

Changing this can be used to customize permissions of the sandbox the flatpak will run in.

#### options.files
Type: `Array[Array[source, dest]]`
Default:
```js
[],
```

Files to copy directly into the app. Should be a list of [source, dest] tuples.
Source should be a relative/absolute path to a file/directory to copy into the
flatpak, and dest should be the path inside the app install prefix (e.g.
/share/applications/)

Application assets and code will be fully handled by `electron-packager`, but
this is a useful way to install things such as appstream metadata for an app,
or dbus configuration files.

#### options.symlinks
Type: `Array[Array[target, location]]`
Default:
```js
[],
```

Symlinks to create in the app files. Should be a list of [target, location]
symlink tuples. Target can be either a relative or absolute path inside the app
install prefix, and location should be a absolute path inside the prefix to
create the symlink at.

#### options.modules
Type: `Array[Object]`
Default: `[]`

This option can be used to build extra software modules into the flatpak
application sandbox. Most electron applications will not need this, but if you
are using native node modules that require certain libraries on the system, this
may be necessary. For example, to build [libgit2](https://libgit2.github.com/)
to use with [nodegit](https://github.com/nodegit/nodegit), add the following to
your modules list.
```
modules: [
  {
    name: 'libgit2',
    cmake: true,
    configOpts: [ '-DBUILD_SHARED_LIBS:BOOL=ON', '-DTHREADSAFE=ON' ],
    sources: [{
      type: 'git',
      url: 'https://github.com/libgit2/libgit2.git',
      branch: 'maint/v0.24'
    }]
  }
]
```

See the [`modules` field of a flatpak-builder manifest](http://flatpak.org/flatpak/flatpak-docs.html#flatpak-builder) for more details.

For apps using Electron 6 or above, the [`zypak`](https://github.com/refi64/zypak) module is
included by default so sandbox support works correctly. Since it needs to compile the module,
it only works when the host arch and target arch are the same.

#### options.bin
Type: `String`
Default: `package.name`

Relative path to the executable that will act as binary for the application, used in the [`Exec` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).

The generated package will contain a symlink `/usr/bin/<%= options.name %>` pointing to the path provided here.

For example, providing this configuration:

```js
{
  src: '...',
  dest: '...',
  name: 'foo',
  bin: 'resources/cli/launcher.sh'
}
```

Will create a package with the following symlink:

```
usr/bin/foo@ -> ../lib/foo/resources/cli/launcher.sh
```

And a desktop specification with the following `Exec` key:

```
Exec=foo %U
```

#### options.icon
Type: `String` or `Object[String:String]`
Default: `undefined`

Path to a single image that will act as icon for the application:

```js
{
  icon: 'resources/Icon.png'
}
```

Or multiple images with their corresponding resolutions:

```js
{
  icon: {
    '48x48': 'resources/Icon48.png',
    '64x64': 'resources/Icon64.png',
    '128x128': 'resources/Icon128.png',
    '256x256': 'resources/Icon256.png'
  }
}
```

#### options.categories
Type: `Array[String]`
Default: `[]`

Categories in which the application should be shown in a menu, used in the [`Categories` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).

For possible values check out the [Desktop Menu Specification](http://standards.freedesktop.org/menu-spec/latest/apa.html).

#### options.mimeType
Type: `Array[String]`
Default: `[]`

MIME types the application is able to open, used in the [`MimeType` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).


## Meta

* Code: `git clone https://github.com/malept/electron-installer-flatpak.git`
* Home: <https://github.com/malept/electron-installer-flatpak/>


## Contributors

* Daniel Perez Alvarez ([unindented@gmail.com](mailto:unindented@gmail.com))
* Matt Watson ([mattdangerw@gmail.com](mailto:mattdangerw@gmail.com))
* [Mark Lee](https://github.com/malept)

## License

Copyright (c) 2016 Daniel Perez Alvarez ([unindented.org](https://unindented.org/)). This is free software, and may be redistributed under the terms specified in the LICENSE file.
