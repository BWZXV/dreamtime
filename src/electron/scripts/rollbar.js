const _ = require('lodash')
const { Rollbar } = require('electron-utils')
const debug = require('debug').default('app:electron:modules:rollbar')

const settings = require('./settings')
const nucleus = require('./nucleus')

const instance = {
  isEnabled: false,

  instance: undefined,

  /**
   *
   */
  init() {
    if (!this.can()) {
      return
    }

    const config = this.getConfig()

    try {
      this.instance = new Rollbar(config)
      this.isEnabled = true

      debug('Rollbar initialized!', config)
    } catch (err) {
      console.warn('Error at connecting to Rollbar', err)
    }
  },

  /**
   *
   */
  getConfig() {
    return {
      accessToken: this.getAccessToken(),
      captureUncaught: true,
      captureUnhandledRejections: true,
      captureIp: 'anonymize',
      verbose: process.env.NODE_ENV === 'development',
      nodeSourceMaps: true,
      reportLevel: 'warning',
      payload: {
        environment:
          process.env.NODE_ENV !== 'development' ? 'production' : 'development',
        person: {
          id: settings.user,
        },
        client: {
          javascript: {
            source_map_enabled: true,
            code_version: process.env.APP_VERSION,
          },
        },
        settings: settings.payload,
      },
    }
  },

  /**
   *
   */
  getAccessToken() {
    return (
      process.env.ROLLBAR_ACCESS_TOKEN
      || _.get(nucleus, 'keys.rollbar_access_token')
    )
  },

  /**
   *
   */
  can() {
    return settings.telemetry.enabled && this.getAccessToken()
  },
}

module.exports = new Proxy(instance, {
  get(obj, prop) {
    if (prop in obj) {
      return obj[prop]
    }

    if (obj.instance && prop in obj.instance) {
      if (obj.isEnabled) {
        return obj.instance[prop]
      }
    }

    return () => { }
  },
})
