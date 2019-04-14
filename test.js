const test = require('tape')
const { 'api-charts': charts } = require('.')

//
// Create a mock request and response method
//

function status (code) {
  this.statusCode = code
  return this
}

function send (obj) {
  const body = { ...this, ...obj }
  return body
}

const res = {
  status,
  send
}

test('sanity', t => {
  t.ok(true)
  t.end()
})

test('pass - charts for BTC-LTC for 1d on Coinbase with start & end dates'
  , async t => {
    const req = {
      body: {
        asset: 'BTC-LTC',
        end: (Date.now() * 1000) - (86400 * 1000 * 3),
        exchange: 'Coinbase',
        start: (Date.now() * 1000) - (86400 * 1000 * 10),
        timeframe: '1d'
      }
    }
    const { err, data, statusCode } = await charts(req, res)
    t.equals(statusCode, 200)
    t.ok(!err)
    t.ok(data)
    t.end()
  })

test('pass - charts for BTC-LTC for 1d on Binance with start & end dates'
  , async t => {
    const req = {
      body: {
        asset: 'BTC-LTC',
        end: (Date.now() * 1000) - (86400 * 1000 * 3),
        exchange: 'Binance',
        start: (Date.now() * 1000) - (86400 * 1000 * 10),
        timeframe: '1d'
      }
    }
    const { err, data, statusCode } = await charts(req, res)
    t.equals(statusCode, 200)
    t.ok(!err)
    t.ok(data)
    t.end()
  })

test('pass - charts for BTC-LTC for 1d on Coinbase with start date'
  , async t => {
    const req = {
      body: {
        asset: 'BTC-LTC',
        exchange: 'Coinbase',
        start: (Date.now() * 1000) - (86400 * 1000 * 10),
        timeframe: '1d'
      }
    }
    const { err, data, statusCode } = await charts(req, res)
    t.equals(statusCode, 200)
    t.ok(!err)
    t.ok(data)
    t.end()
  })

test('pass - charts for BTC-LTC for 1d on Binance with start date'
  , async t => {
    const req = {
      body: {
        asset: 'BTC-LTC',
        exchange: 'Binance',
        start: (Date.now() * 1000) - (86400 * 1000 * 10),
        timeframe: '1d'
      }
    }
    const { err, data, statusCode } = await charts(req, res)
    t.equals(statusCode, 200)
    t.ok(!err)
    t.ok(data)
    t.end()
  })

test('pass - charts for BTC-LTC, BTC-ZRX, USD-BTC for 1d on Coinbase',
  async t => {
    const req = {
      body: {
        assets: 'BTC-LTC,BTC-ZRX, USD-BTC',
        exchange: 'Coinbase',
        timeframe: '1d'
      }
    }
    const { err, data, statusCode } = await charts(req, res)
    t.equals(statusCode, 200)
    t.ok(!err)
    t.ok(data)
    t.end()
  })

test('pass - charts for BTC-LTC, BTC-XRP, USDT-BTC for 1d on Binance',
  async t => {
    const req = {
      body: {
        assets: 'BTC-LTC,BTC-XRP, USDT-BTC',
        exchange: 'Binance',
        timeframe: '1d'
      }
    }
    const { err, data, statusCode } = await charts(req, res)
    t.equals(statusCode, 200)
    t.ok(!err)
    t.ok(data)
    t.end()
  })

test('pass - charts for BTC-LTC for 1d on Coinbase', async t => {
  const req = {
    body: {
      asset: 'BTC-LTC',
      exchange: 'Coinbase',
      timeframe: '1d'
    }
  }
  const { err, data, statusCode } = await charts(req, res)
  t.equals(statusCode, 200)
  t.ok(!err)
  t.ok(data)
  t.end()
})

test('pass - charts for BTC-LTC for 1d on Binance', async t => {
  const req = {
    body: {
      asset: 'BTC-LTC',
      exchange: 'Binance',
      timeframe: '1d'
    }
  }
  const { err, data, statusCode } = await charts(req, res)
  t.equals(statusCode, 200)
  t.ok(!err)
  t.ok(data)
  t.end()
})

test('fail - charts for BTC-LTC for 4h timeframe on Coinbase', async t => {
  const req = {
    body: {
      asset: 'BTC-LTC',
      exchange: 'Coinbase',
      timeframe: '4h'
    }
  }
  const { err, data, statusCode } = await charts(req, res)
  t.ok(err)
  t.ok(!data)
  t.equals(statusCode, 404)
  t.equals(err, `Timeframe, 4h, not supported on Coinbase.`)
  t.end()
})

test('fail - charts for BTC-LTC for 16h timeframe on Binance', async t => {
  const req = {
    body: {
      asset: 'BTC-LTC',
      exchange: 'Binance',
      timeframe: '16h'
    }
  }
  const { err, data, statusCode } = await charts(req, res)
  t.ok(!data)
  t.equals(statusCode, 404)
  t.ok(err)
  t.equals(err, `Timeframe, 16h, not supported on Binance.`)
  t.end()
})

test('fail - charts for BTC-XXX, BTC-YYY for 1d on Coinbase', async t => {
  const req = {
    body: {
      assets: 'BTC-XXX,BTC-YYY',
      exchange: 'Coinbase',
      timeframe: '1d'
    }
  }
  const { err, data, statusCode } = await charts(req, res)
  t.ok(!err)
  t.ok(data)
  t.equals(statusCode, 200)
  t.deepEqual(data, [ { asset: 'BTC-XXX', err: 'HTTP 404 Error: NotFound' },
    { asset: 'BTC-YYY', err: 'HTTP 404 Error: NotFound' } ])
  t.end()
})

test('fail - charts for BTC-XXX, BTC-YYY for 1d on Binance', async t => {
  const req = {
    body: {
      assets: 'BTC-XXX,BTC-YYY',
      exchange: 'Binance',
      timeframe: '1d'
    }
  }
  const { err, data, statusCode } = await charts(req, res)
  t.ok(!err)
  t.ok(data)
  t.equals(statusCode, 200)
  t.deepEqual(data, [ { asset: 'BTC-XXX', err: 'Invalid symbol.' },
    { asset: 'BTC-YYY', err: 'Invalid symbol.' } ])
  t.end()
})
