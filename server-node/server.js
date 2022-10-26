const express = require('express')
const bodyParser = require('body-parser')
const Hashring = require('hashring')
const async = require('async')

const app = express()
const port = 1234

class Heartbeat {
  constructor () {
    this.timeout = 10 // second
    this.services = {
      talkback: {},
      stream: {}
    }
  }

  add ({
    hostname,
    command,
    type,
    interval,
    service,
    serviceHost
  }) {
    if (service === 'talkback') {
      this.services.talkback[serviceHost] = {
        serviceHost,
        service,
        hostname,
        interval,
        updated: Date.now()
      }
    }

    if (service === 'stream') {
      this.services.stream[serviceHost] = {
        serviceHost,
        service,
        hostname,
        interval,
        updated: Date.now()
      }
    }
  }

  /**
   * Return list of live service
   *
   * @param {string} service
   * @param {calback} cb (err, [live])
   * live:
   * {
   *   serviceHost,
   *   service,
   *   hostname,
   *   updated
   * }
   * @returns none
   * @memberof Heartbeat
   */
  getLive (service, cb) {
    const serviceObj = this.services[service]
    if (!serviceObj) {
      return cb(new Error('service not found'))
    }

    let lives = []
    Object.keys(serviceObj).forEach(k => {
      if (serviceObj[k].updated >= Date.now() - this.timeout * 1000) {
        lives.push(serviceObj[k])
      }
    })

    cb(null, lives)
  }

  _getLiveServices (service, cb) {
    const serviceObj = this.services[service]
    if (!serviceObj) {
      return cb(new Error('service not found'))
    }

    let liveServices = Object.keys(serviceObj).filter(obj => {
      return (serviceObj[obj].updated >= Date.now() - this.timeout * 1000)
    })

    cb(null, liveServices)
  }

  getEndpoint (service, key, cb) {
    this._getLiveServices(service, (err, liveServices) => {
      if (err) {
        return cb(err)
      }

      // may be slow
      const ring = new Hashring(liveServices)
      return cb(null, ring.get(key))
    })
  }
}

let hb = new Heartbeat()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/talkbackhosts', (_req, res) => {
  hb.getLive('talkback', (err, result) => {
    if (err) {
      return res.send('not found')
    }
    res.send(result)
  })
})

app.get('/streamhosts', (_req, res) => {
  hb.getLive('stream', (err, result) => {
    if (err) {
      return res.send('not found')
    }
    res.send(result)
  })
})

app.get('/talkback', (_req, res) => {
  const keys = [
    '68c78af4-6465-4335-896f-a48f57ed550f',
    '29d2ab55-83d5-4f28-8c58-c5253fe6ab5e',
    '21e4469f-1770-48e6-9f9c-452bcd2e7a43',
    'dd49707e-7102-496b-bf5f-78f818fa4d6e',
    '37444ccc-f016-4caa-a035-e8c59469d2af',
    '9b54376f-820e-4f52-96d2-4876ed5316f0',
    'fb49fe95-ed5e-4fb6-b34c-18adf0e77ca7',
    '71e4d6ca-4baa-4d29-86f1-3ab08a1a1187',
    '6ee073d6-a65e-46a2-95e7-97516abb949e',
    '6cd6fa84-f99e-41c2-b3de-7e4ed303582e' ]

  async.map(keys, getTalkback, (err, result) => {
    if (err) {
      return res.send(err)
    }
    return res.send(result)
  })

  function getTalkback (key, next) {
    hb.getEndpoint('talkback', key, (err, endpoint) => {
      if (err) {
        return next(err)
      }
      return next(null, { key, endpoint })
    })
  }
})

app.put('/heartbeat', (req, res) => {
  const auth = req.header('Authorization')
  if (!auth) {
    return res.sendStatus(401)
  }

  hb.add(req.body)
  // console.log(hb)
  res.send('Hello World!')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
