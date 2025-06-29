import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import * as tatumUtils from '../src/utils/tatum.js';
import { exchangeRateService } from '../src/services/exchange-rate-service.js';

describe('Exchange Rate Service', () => {
  let tatumStub;

  beforeEach(() => {
    tatumStub = sinon.stub(tatumUtils, 'getTatumExchangeRateRest');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getSingleRate', () => {
    it('should return exchange rate for valid crypto/fiat pair', async () => {
      const mockRate = 88375.98;
      tatumStub.resolves(mockRate);

      const result = await exchangeRateService.getSingleRate('BTC', 'USD');

      expect(result).to.deep.equal({
        crypto: 'BTC',
        fiat: 'USD',
        rate: mockRate,
        timestamp: sinon.match.string
      });
      expect(tatumStub.calledOnceWith('BTC', 'USD')).to.be.true;
    });

    it('should throw error for invalid crypto symbol', async () => {
      try {
        await exchangeRateService.getSingleRate('', 'USD');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid crypto symbol');
      }
    });

    it('should throw error for invalid fiat symbol', async () => {
      try {
        await exchangeRateService.getSingleRate('BTC', '');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Invalid fiat symbol');
      }
    });

    it('should handle Tatum API errors gracefully', async () => {
      const apiError = new Error('Tatum API error: 404 Not Found');
      tatumStub.rejects(apiError);

      try {
        await exchangeRateService.getSingleRate('BTC', 'USD');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to fetch exchange rate');
        expect(error.originalError).to.equal(apiError);
      }
    });
  });

  describe('getBatchRates', () => {
    it('should return multiple exchange rates for valid pairs', async () => {
      const pairs = [
        { crypto: 'BTC', fiat: 'USD' },
        { crypto: 'ETH', fiat: 'EUR' }
      ];
      
      tatumStub.onFirstCall().resolves(88375.98);
      tatumStub.onSecondCall().resolves(3245.67);

      const result = await exchangeRateService.getBatchRates(pairs);

      expect(result.rates).to.have.length(2);
      expect(result.rates[0]).to.deep.include({
        crypto: 'BTC',
        fiat: 'USD',
        rate: 88375.98
      });
      expect(result.rates[1]).to.deep.include({
        crypto: 'ETH',
        fiat: 'EUR',
        rate: 3245.67
      });
      expect(result.timestamp).to.be.a('string');
    });

    it('should throw error for empty pairs array', async () => {
      try {
        await exchangeRateService.getBatchRates([]);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('At least one currency pair is required');
      }
    });

    it('should throw error for too many pairs', async () => {
      const pairs = Array(11).fill({ crypto: 'BTC', fiat: 'USD' });
      
      try {
        await exchangeRateService.getBatchRates(pairs);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Maximum 10 currency pairs allowed');
      }
    });

    it('should handle partial failures in batch requests', async () => {
      const pairs = [
        { crypto: 'BTC', fiat: 'USD' },
        { crypto: 'INVALID', fiat: 'EUR' }
      ];
      
      tatumStub.onFirstCall().resolves(88375.98);
      tatumStub.onSecondCall().rejects(new Error('Invalid crypto'));

      const result = await exchangeRateService.getBatchRates(pairs);

      expect(result.rates).to.have.length(2);
      expect(result.rates[0]).to.deep.include({
        crypto: 'BTC',
        fiat: 'USD',
        rate: 88375.98
      });
      expect(result.rates[1]).to.deep.include({
        crypto: 'INVALID',
        fiat: 'EUR',
        error: 'Invalid crypto'
      });
    });
  });

  describe('validateCurrencyPair', () => {
    it('should validate correct currency pair format', () => {
      const validPair = { crypto: 'BTC', fiat: 'USD' };
      expect(() => exchangeRateService.validateCurrencyPair(validPair)).to.not.throw();
    });

    it('should throw error for missing crypto field', () => {
      const invalidPair = { fiat: 'USD' };
      expect(() => exchangeRateService.validateCurrencyPair(invalidPair))
        .to.throw('Invalid currency pair: crypto field is required');
    });

    it('should throw error for missing fiat field', () => {
      const invalidPair = { crypto: 'BTC' };
      expect(() => exchangeRateService.validateCurrencyPair(invalidPair))
        .to.throw('Invalid currency pair: fiat field is required');
    });

    it('should throw error for non-string crypto field', () => {
      const invalidPair = { crypto: 123, fiat: 'USD' };
      expect(() => exchangeRateService.validateCurrencyPair(invalidPair))
        .to.throw('Invalid currency pair: crypto must be a string');
    });
  });
});