# Exchange Rates API

This document describes the exchange rate endpoints that provide crypto/fiat currency exchange rates using the Tatum API.

## Endpoints

### GET /api/exchange-rates/:crypto/:fiat

Get a single exchange rate for a specific crypto/fiat pair.

**Parameters:**
- `crypto` (string): Cryptocurrency symbol (e.g., BTC, ETH, ADA)
- `fiat` (string): Fiat currency symbol (e.g., USD, EUR, GBP)

**Example Request:**
```bash
GET /api/exchange-rates/BTC/USD
```

**Example Response:**
```json
{
  "crypto": "BTC",
  "fiat": "USD",
  "rate": 88375.98,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### POST /api/exchange-rates

Get multiple exchange rates for an array of crypto/fiat pairs.

**Request Body:**
```json
{
  "pairs": [
    { "crypto": "BTC", "fiat": "USD" },
    { "crypto": "ETH", "fiat": "EUR" },
    { "crypto": "ADA", "fiat": "GBP" }
  ]
}
```

**Example Response:**
```json
{
  "rates": [
    {
      "crypto": "BTC",
      "fiat": "USD",
      "rate": 88375.98,
      "timestamp": "2025-01-01T00:00:00.000Z"
    },
    {
      "crypto": "ETH",
      "fiat": "EUR",
      "rate": 3245.67,
      "timestamp": "2025-01-01T00:00:00.000Z"
    },
    {
      "crypto": "ADA",
      "fiat": "GBP",
      "rate": 0.85,
      "timestamp": "2025-01-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**Constraints:**
- Maximum 10 currency pairs per batch request
- At least 1 currency pair is required

### GET /api/exchange-rates/supported

Get lists of supported cryptocurrencies and fiat currencies.

**Example Response:**
```json
{
  "cryptos": [
    "BTC", "ETH", "ADA", "DOT", "LTC", "XRP", "BCH", "EOS", "TRX", "XLM",
    "LINK", "UNI", "AAVE", "COMP", "MKR", "SNX", "YFI", "SUSHI", "CRV",
    "BAL", "MATIC", "AVAX", "SOL", "LUNA", "FTT", "SRM", "RAY"
  ],
  "fiats": [
    "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD",
    "MXN", "SGD", "HKD", "NOK", "TRY", "ZAR", "BRL", "INR", "KRW", "PLN",
    "CZK", "HUF", "RON", "BGN", "HRK", "RUB", "UAH", "AED", "SAR"
  ]
}
```

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

### 400 Bad Request
- Missing required parameters
- Invalid currency symbols
- Empty pairs array
- Too many pairs (>10)

**Example Error Response:**
```json
{
  "error": "Invalid parameters",
  "message": "Invalid crypto symbol: must be a non-empty string"
}
```

### 500 Internal Server Error
- Tatum API errors
- Network connectivity issues
- Server-side processing errors

**Example Error Response:**
```json
{
  "error": "Failed to fetch exchange rate",
  "message": "Tatum API error: 404 Not Found"
}
```

## Environment Variables

Make sure to set the following environment variable:

```bash
TATUM_API_KEY=your_tatum_api_key_here
```

## Testing

To test the exchange rate endpoints, you can use the provided test script:

```bash
# Start the server first
pnpm dev

# In another terminal, run the exchange rate tests
node test-exchange-rates.js
```

## Implementation Details

- **Service Layer**: [`src/services/exchange-rate-service.js`](src/services/exchange-rate-service.js)
- **Routes**: [`src/routes/exchange-rates.js`](src/routes/exchange-rates.js)
- **Tatum Integration**: [`src/utils/tatum.js`](src/utils/tatum.js)

The implementation follows the existing project patterns:
- Clean separation of concerns
- Comprehensive error handling
- Input validation
- Consistent API response format
- ESM module structure