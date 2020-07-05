'use strict'

const path = require('path')
const { app, BrowserWindow, Menu, Tray } = require('electron')

let quitting = false
let tray = null
let win = null

function createMenu () {
  const appMenu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    }
  ])
  Menu.setApplicationMenu(appMenu)
}

function createTray () {
  const variant = (process.platform === 'darwin' ? 'Black' : 'White')

  tray = new Tray(path.resolve(__dirname, `../../resources/Icon${variant}Template.png`))

  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Preferences...',
      click: () => {
        win.show()
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])
  tray.setContextMenu(trayMenu)
}

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    icon: path.resolve(__dirname, '../../resources/Icon.png')
  })
  win.loadFile(path.resolve(__dirname, '..', 'renderer', 'index.html'))

  win.on('close', (evt) => {
    if (quitting) {
      return
    }

    evt.preventDefault()
    win.hide()
  })

  win.on('closed', () => {
    tray = null
    win = null
  })
}

app.on('before-quit', () => {
  quitting = true
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('ready', () => {
  createMenu()
  createTray()
  createWindow()
})
