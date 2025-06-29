import { exchangeRateService } from '../services/exchange-rate-service.js';
import { errorUtils } from '../utils/error-utils.js';

/**
 * Handler for GET /api/exchange-rates/:crypto/:fiat
 * Returns a single exchange rate for the specified crypto/fiat pair
 * @param {Object} c - Hono context
 * @returns {Response} JSON response with exchange rate data
 */
export async function getSingleRateHandler(c) {
  try {
    const crypto = c.req.param('crypto');
    const fiat = c.req.param('fiat');

    // Validate required parameters
    if (!crypto || !fiat) {
      return c.status(400).json({
        error: 'Missing required parameters',
        message: 'Both crypto and fiat parameters are required'
      });
    }

    // Get exchange rate from service
    const rateData = await exchangeRateService.getSingleRate(crypto, fiat);
    
    return c.json(rateData);
  } catch (error) {
    console.error('Error in getSingleRateHandler:', error);
    
    // Handle validation errors with 400 status
    if (error.message.includes('Invalid')) {
      return c.status(400).json({
        error: 'Invalid parameters',
        message: error.message
      });
    }

    // Handle other errors with 500 status
    return c.status(500).json({
      error: 'Failed to fetch exchange rate',
      message: error.message
    });
  }
}

/**
 * Handler for POST /api/exchange-rates
 * Returns multiple exchange rates for the specified crypto/fiat pairs
 * @param {Object} c - Hono context
 * @returns {Response} JSON response with batch exchange rate data
 */
export async function getBatchRatesHandler(c) {
  try {
    const requestBody = await c.req.json();

    // Validate request body structure
    if (!requestBody || !requestBody.pairs || !Array.isArray(requestBody.pairs)) {
      return c.status(400).json({
        error: 'Invalid request body',
        message: 'Request body must contain a "pairs" array'
      });
    }

    // Get batch exchange rates from service
    const batchData = await exchangeRateService.getBatchRates(requestBody.pairs);
    
    return c.json(batchData);
  } catch (error) {
    console.error('Error in getBatchRatesHandler:', error);
    
    // Handle validation errors with 400 status
    if (error.message.includes('Invalid') || 
        error.message.includes('required') || 
        error.message.includes('Maximum')) {
      return c.status(400).json({
        error: 'Invalid request',
        message: error.message
      });
    }

    // Handle other errors with 500 status
    return c.status(500).json({
      error: 'Failed to fetch batch exchange rates',
      message: error.message
    });
  }
}

/**
 * Handler for GET /api/exchange-rates/supported
 * Returns lists of supported cryptocurrencies and fiat currencies
 * @param {Object} c - Hono context
 * @returns {Response} JSON response with supported currencies
 */
export async function getSupportedCurrenciesHandler(c) {
  try {
    const cryptos = exchangeRateService.getSupportedCryptos();
    const fiats = exchangeRateService.getSupportedFiats();
    
    return c.json({
      cryptos,
      fiats
    });
  } catch (error) {
    console.error('Error in getSupportedCurrenciesHandler:', error);
    
    return c.status(500).json({
      error: 'Failed to fetch supported currencies',
      message: error.message
    });
  }
}

/**
 * Exchange rate route configurations
 */
export const exchangeRateRoutes = [
  {
    method: 'GET',
    path: '/api/exchange-rates/supported',
    handler: getSupportedCurrenciesHandler
  },
  {
    method: 'GET',
    path: '/api/exchange-rates/:crypto/:fiat',
    handler: getSingleRateHandler
  },
  {
    method: 'POST',
    path: '/api/exchange-rates',
    handler: getBatchRatesHandler
  }
];