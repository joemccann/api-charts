
const Binance = require('binance-api-node')
const binance = Binance.default()
const { PublicClient: Coinbase } = require('gdax')
const coinbase = new Coinbase()
const moment = require('moment')

const ERR_NO_EXCHANGE = `An exchange is required: 'Binance' || 'Coinbase'.`
const ERR_NO_ASSET = `An asset is required: 'BTC-LTC' || 'USDT-BTC' || ...`
const ERR_NO_TIMEFRAME = `A timeframe is required: '1m' || '5m' || '15m' || ` +
  `'30m' || '1h' || '4h' || '1d' || '1w' || '1M'`

const BINANCE_REGEX = /1m|5m|15m|30m|1h|4h|1d|1w|1M/

const formatAsset = (args) => {
  const {
    asset,
    exchange
  } = args

  let data = null

  const { 0: quote, 1: base } = asset.split('-')

  switch (exchange) {
    case 'BINANCE':
      data = base + quote
      break

    case 'COINBASE':
      data = [base, quote].join('-')
      break

    default:
      break
  }

  if (!data) return { err: `Exchange, ${exchange}, is not supported.` }

  return { data }
}

const formatTimeframe = (args) => {
  const {
    exchange,
    timeframe
  } = args

  let data = null

  switch (exchange) {
    case 'BINANCE':
      if (!BINANCE_REGEX.test(timeframe)) {
        return { err: `Timeframe, ${timeframe}, not supported on Binance.` }
      }
      data = String(timeframe)
      break

    case 'COINBASE':
      switch (timeframe) {
        case '1m':
          data = 60
          break
        case '5m':
          data = 300
          break
        case '15m':
          data = 90
          break
        case '1h':
          data = 3600
          break
        case '1d':
          data = 86400
          break
        default:
          return { err: `Timeframe, ${timeframe}, not supported on Coinbase.` }
      }
      break

    default:
      break
  }

  if (!data) return { err: `Exchange, ${exchange}, is not supported.` }

  return { data }
}

const normalizeChartData = (args) => {
  const {
    exchange,
    candles
  } = args

  const data = []

  try {
    switch (exchange) {
      case 'BINANCE':

        // https://www.npmjs.com/package/binance-api-node#candles

        candles.forEach((candle) => {
          const high = parseFloat(candle.high)
          const low = parseFloat(candle.low)
          const open = parseFloat(candle.open)
          const close = parseFloat(candle.close)
          const volume = parseFloat(candle.volume)

          let timestamp = candle.timestamp || 0

          if (candle.openTime) {
            timestamp = candle.openTime
          }

          if (candle.closeTime) {
            timestamp = candle.closeTime
          }

          const formattedCandle = {
            close,
            high,
            low,
            open,
            timestamp,
            volume
          }
          data.push(formattedCandle)
        })

        break
      case 'COINBASE':

        // https://docs.pro.coinbase.com/#get-historic-rates

        candles.forEach((candle) => {
          const high = candle[2]
          const low = candle[1]
          const open = candle[3]
          const close = candle[4]
          const volume = candle[5]
          const timestamp = candle[0] * 1000
          const formattedCandle = {
            close,
            high,
            low,
            open,
            timestamp,
            volume
          }
          data.push(formattedCandle)
        })

        break

      default:
        break
    }
  } catch (err) {
    return { err: err.message }
  }

  if (!data.length) {
    return {
      err: `Exchange, ${exchange}, is not supported.`
    }
  }

  return { data }
}

const fetchChartData = async (args) => {
  let {
    end,
    exchange,
    start
  } = args

  let candles = null

  //
  // Must be Unix timestamps in milliseconds
  //
  if (start) start = parseInt(start)
  if (end) end = parseInt(end)

  if (exchange === 'BINANCE') {
    const { err: faErr, data: symbol } = formatAsset(args)
    const { err: ftErr, data: interval } = formatTimeframe(args)

    if (faErr) return { err: faErr }
    if (ftErr) return { err: ftErr }

    const params = {
      symbol,
      interval,
      endTime: Date.now()
    }

    if (start) params.startTime = start
    if (end) params.endTime = end

    try {
      candles = await binance.candles(params)
    } catch (err) {
      return { err: err.message }
    }

    const { err, data } = normalizeChartData({ exchange, candles })

    if (err) return { err }

    return { data }
  }

  if (exchange === 'COINBASE') {
    const { err: faErr, data: asset } = formatAsset(args)
    const { err: ftErr, data: granularity } = formatTimeframe(args)

    if (faErr) return { err: faErr }
    if (ftErr) return { err: ftErr }

    const params = {
      end: moment().toISOString(),
      granularity
    }

    if (start) params.start = moment(start).toISOString()
    if (end) params.end = moment(end).toISOString()

    try {
      candles = await coinbase.getProductHistoricRates(asset, params)
    } catch (err) {
      return { err: err.message }
    }

    const { err, data } = normalizeChartData({ exchange, candles })

    if (err) return { err }

    return { data }
  } else return { err: `Exchange, ${exchange}, not supported.` }
}

const multi = async (args) => {
  const {
    assets,
    exchange,
    timeframe
  } = args

  const promises = assets.map(async (asset) => {
    const params = {
      asset,
      exchange,
      timeframe
    }
    const { err, data } = await fetchChartData(params)
    if (err) return { asset, err }
    return { asset, data, exchange, timeframe }
  })

  try {
    const data = await Promise.all(promises)
    return { data }
  } catch (err) {
    return { err: err.message }
  }
}

exports['api-charts'] = async (req, res) => {
  const {
    body = {},
    query = {}
  } = req

  let exchange = body.exchange || query.exchange
  let asset = body.asset || query.asset
  let assets = body.assets || query.assets

  const timeframe = body.timeframe || query.timeframe

  if (!exchange) return { err: ERR_NO_EXCHANGE }
  if (!asset && !assets) return { err: ERR_NO_ASSET }
  if (!timeframe) return { err: ERR_NO_TIMEFRAME }

  //
  // Convert to an array
  //
  if (assets) assets = assets.split(',')

  exchange = exchange.toUpperCase()

  if (assets) {
    //
    // Clean and normalize the asset pairs.
    //
    assets = assets.map(asset => asset.toUpperCase().trim())

    const { err, data } = await multi({ assets, exchange, timeframe })
    if (err) return res.send({ err: err.message })
    return res.send({ data })
  } else {
    exchange = exchange.toUpperCase()
    asset = asset.toUpperCase()

    const { err, data } = await fetchChartData({ asset, exchange, timeframe })

    if (err) return res.send({ err })

    return res.send({ data })
  }
}
