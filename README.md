# SYNOPSIS

📊 Opinionated, REST-ful API for fetching chart/candle data from a cryptocurrency exchange for an asset or set of assets.

## REQUIREMENTS

1. A Google Cloud Account.
2. Billing Enabled.
3. API Access Enabled.
4. `gcloud` CLI installed and in your `$PATH`.
5. A preferred configuration created ( `gcloud init` ).

## USAGE

```sh
curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-charts?exchange=binance&asset=btc-ltc&timeframe=1d
```

Or, if you prefer a `POST`:

```sh
curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-charts --data '{"exchange": "binance", "asset": "btc-ltc", "timeframe": "1d"}' -H "Content-Type: application/json"
```

The expected response:

```js
{
  "data": [
    {
      "close": 6.399e-05,
      "high": 6.407e-05,
      "low": 6.387e-05,
      "open": 6.407e-05,
      "timestamp": 1555113600000,
      "volume": 14872
    },
    ...
  }
}
```

Or in the case there is a failure:

```js
{
  "err": "Timeframe, 3h, not supported on Coinbase."
}
```

## API

```sh
# One asset, on Binance, daily timeframe
curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-charts?exchange=binance&asset=btc-ltc&timeframe=1d

# Three assets, on Binance, hourly timeframe; NOTE: response is an array of objects: {asset: XXX-YYYY, data: [{close, high, low, open, timestamp, volume}...]}
curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-charts?assets=BTC-LTC,BTC-XRP,USDT-ZEC&exchange=Binance&timeframe=1h

# One asset, on Coinbase, hourly timeframe, with start date in Unix timstamp format in milliseconds
curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-charts?asset=BTC-XRP&exchange=Coinbase&start=1555116991951000&timeframe=1h

# One asset, on Coinbase, hourly timeframe, with start and end dates in Unix timstamp format in milliseconds
curl https://${DEFAULT_REGION}-${PROJECT}.cloudfunctions.net/api-charts?asset=BTC-XRP&exchange=Coinbase&start=1555116991951000&end=1555119991951000&timeframe=1h
```

## DEPLOY

First, fork or clone this repo, then:

```sh
npm i
```

Now, deploy it GCP, run the following command in the root of this repository:

```sh
gcloud functions deploy api-charts --runtime nodejs10 --trigger-http --memory 128MB
```

You should receive a YAML like response in your terminal including the URL for the Cloud Function.

## TESTS

```sh
npm i -D
npm test
```

## AUTHORS

- [Joe McCann](https://twitter.com/joemccann)

## LICENSE

MIT