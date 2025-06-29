# Exchange Rates API Implementation

## Requirements
- Create GET endpoint for retrieving crypto/fiat exchange rates
- Create POST endpoint for retrieving multiple exchange rates or with custom parameters
- Use existing Tatum API integration
- Follow project patterns for routes, services, and error handling
- Implement comprehensive test coverage

## Tasks

### 1. Create Exchange Rate Service
- [x] Create `src/services/exchange-rate-service.js`
- [x] Implement functions for single and batch rate retrieval
- [x] Add proper error handling and validation
- [x] Write comprehensive tests

### 2. Create Exchange Rate Routes
- [x] Create `src/routes/exchange-rates.js`
- [x] Implement GET `/api/exchange-rates/:crypto/:fiat` endpoint
- [x] Implement POST `/api/exchange-rates` endpoint for batch requests
- [x] Add input validation middleware
- [x] Write route tests

### 3. Integration
- [x] Add routes to main routes index
- [x] Update environment variables if needed
- [x] Test endpoints manually
- [x] Document API endpoints

## API Design

### GET /api/exchange-rates/:crypto/:fiat
- Returns single exchange rate
- Example: GET /api/exchange-rates/BTC/USD
- Response: `{ "crypto": "BTC", "fiat": "USD", "rate": 88375.98, "timestamp": "..." }`

### POST /api/exchange-rates
- Accepts array of crypto/fiat pairs
- Request body: `{ "pairs": [{"crypto": "BTC", "fiat": "USD"}, {"crypto": "ETH", "fiat": "EUR"}] }`
- Response: `{ "rates": [...], "timestamp": "..." }`