import { getTatumExchangeRateRest } from '../utils/tatum.js';

/**
 * Exchange Rate Service
 * Provides functionality for retrieving crypto/fiat exchange rates
 */
class ExchangeRateService {
  /**
   * Get a single exchange rate for a crypto/fiat pair
   * @param {string} crypto - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
   * @param {string} fiat - Fiat currency symbol (e.g., 'USD', 'EUR')
   * @returns {Promise<Object>} Exchange rate data with timestamp
   */
  async getSingleRate(crypto, fiat) {
    // Validate input parameters
    if (!crypto || typeof crypto !== 'string' || crypto.trim() === '') {
      throw new Error('Invalid crypto symbol: must be a non-empty string');
    }
    
    if (!fiat || typeof fiat !== 'string' || fiat.trim() === '') {
      throw new Error('Invalid fiat symbol: must be a non-empty string');
    }

    try {
      const rate = await getTatumExchangeRateRest(crypto.toUpperCase(), fiat.toUpperCase());
      
      return {
        crypto: crypto.toUpperCase(),
        fiat: fiat.toUpperCase(),
        rate,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const exchangeError = new Error(`Failed to fetch exchange rate for ${crypto}/${fiat}: ${error.message}`);
      exchangeError.originalError = error;
      throw exchangeError;
    }
  }

  /**
   * Get multiple exchange rates for an array of crypto/fiat pairs
   * @param {Array<Object>} pairs - Array of {crypto, fiat} objects
   * @returns {Promise<Object>} Object containing rates array and timestamp
   */
  async getBatchRates(pairs) {
    // Validate input
    if (!Array.isArray(pairs) || pairs.length === 0) {
      throw new Error('At least one currency pair is required');
    }

    if (pairs.length > 10) {
      throw new Error('Maximum 10 currency pairs allowed per batch request');
    }

    // Validate each pair
    pairs.forEach((pair, index) => {
      try {
        this.validateCurrencyPair(pair);
      } catch (error) {
        throw new Error(`Invalid pair at index ${index}: ${error.message}`);
      }
    });

    const timestamp = new Date().toISOString();
    const rates = [];

    // Process each pair, handling individual failures gracefully
    for (const pair of pairs) {
      try {
        const rateData = await this.getSingleRate(pair.crypto, pair.fiat);
        rates.push(rateData);
      } catch (error) {
        // Include failed requests with error information
        rates.push({
          crypto: pair.crypto.toUpperCase(),
          fiat: pair.fiat.toUpperCase(),
          error: error.message,
          timestamp
        });
      }
    }

    return {
      rates,
      timestamp
    };
  }

  /**
   * Validate a currency pair object
   * @param {Object} pair - Currency pair object
   * @throws {Error} If validation fails
   */
  validateCurrencyPair(pair) {
    if (!pair || typeof pair !== 'object') {
      throw new Error('Invalid currency pair: must be an object');
    }

    if (!pair.crypto) {
      throw new Error('Invalid currency pair: crypto field is required');
    }

    if (!pair.fiat) {
      throw new Error('Invalid currency pair: fiat field is required');
    }

    if (typeof pair.crypto !== 'string') {
      throw new Error('Invalid currency pair: crypto must be a string');
    }

    if (typeof pair.fiat !== 'string') {
      throw new Error('Invalid currency pair: fiat must be a string');
    }

    if (pair.crypto.trim() === '') {
      throw new Error('Invalid currency pair: crypto cannot be empty');
    }

    if (pair.fiat.trim() === '') {
      throw new Error('Invalid currency pair: fiat cannot be empty');
    }
  }

  /**
   * Get supported cryptocurrency symbols
   * @returns {Array<string>} Array of supported crypto symbols
   */
  getSupportedCryptos() {
    return [
      'BTC', 'ETH', 'ADA', 'DOT', 'LTC', 'XRP', 'BCH', 'EOS', 'TRX', 'XLM',
      'LINK', 'UNI', 'AAVE', 'COMP', 'MKR', 'SNX', 'YFI', 'SUSHI', 'CRV',
      'BAL', 'MATIC', 'AVAX', 'SOL', 'LUNA', 'FTT', 'SRM', 'RAY'
    ];
  }

  /**
   * Get supported fiat currency symbols
   * @returns {Array<string>} Array of supported fiat symbols
   */
  getSupportedFiats() {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
      'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR', 'BRL', 'INR', 'KRW', 'PLN',
      'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'UAH', 'AED', 'SAR'
    ];
  }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService();