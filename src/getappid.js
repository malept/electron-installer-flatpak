'use strict'

const url = require('url')

function sanitizePackageNameParts (parts) {
  return parts.map(part => part.replace(/[^a-z0-9]/gi, '_').replace(/^[0-9]/, '_$&'))
}

function parseHomepageURL (website) {
  try {
    return new url.URL(website)
  } catch (e) {
    throw new Error(`Could not parse the homepage from package.json as a URL:\n${e.message}`)
  }
}

module.exports = {
  getAppID: function getAppID (name, website) {
    let host = 'electron.atom.io'
    if (website) {
      const urlObject = parseHomepageURL(website)
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
}
