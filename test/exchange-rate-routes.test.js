import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { exchangeRateService } from '../src/services/exchange-rate-service.js';
import { 
  getSingleRateHandler, 
  getBatchRatesHandler,
  getSupportedCurrenciesHandler,
  exchangeRateRoutes 
} from '../src/routes/exchange-rates.js';

describe('Exchange Rate Routes', () => {
  let serviceStub;
  let mockContext;

  beforeEach(() => {
    serviceStub = sinon.stub(exchangeRateService);
    
    // Mock Hono context
    mockContext = {
      req: {
        param: sinon.stub(),
        json: sinon.stub()
      },
      json: sinon.stub(),
      status: sinon.stub().returnsThis(),
      get: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getSingleRateHandler', () => {
    it('should return single exchange rate for valid parameters', async () => {
      const mockRate = {
        crypto: 'BTC',
        fiat: 'USD',
        rate: 88375.98,
        timestamp: '2025-01-01T00:00:00.000Z'
      };

      mockContext.req.param.withArgs('crypto').returns('BTC');
      mockContext.req.param.withArgs('fiat').returns('USD');
      serviceStub.getSingleRate.resolves(mockRate);

      await getSingleRateHandler(mockContext);

      expect(serviceStub.getSingleRate.calledOnceWith('BTC', 'USD')).to.be.true;
      expect(mockContext.json.calledOnceWith(mockRate)).to.be.true;
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service error');
      
      mockContext.req.param.withArgs('crypto').returns('BTC');
      mockContext.req.param.withArgs('fiat').returns('USD');
      serviceStub.getSingleRate.rejects(error);

      await getSingleRateHandler(mockContext);

      expect(mockContext.status.calledWith(500)).to.be.true;
      expect(mockContext.json.calledWith(sinon.match({
        error: 'Failed to fetch exchange rate',
        message: 'Service error'
      }))).to.be.true;
    });

    it('should handle missing parameters', async () => {
      mockContext.req.param.withArgs('crypto').returns(undefined);
      mockContext.req.param.withArgs('fiat').returns('USD');

      await getSingleRateHandler(mockContext);

      expect(mockContext.status.calledWith(400)).to.be.true;
      expect(mockContext.json.calledWith(sinon.match({
        error: 'Missing required parameters'
      }))).to.be.true;
    });
  });

  describe('getBatchRatesHandler', () => {
    it('should return batch exchange rates for valid request', async () => {
      const requestBody = {
        pairs: [
          { crypto: 'BTC', fiat: 'USD' },
          { crypto: 'ETH', fiat: 'EUR' }
        ]
      };

      const mockResponse = {
        rates: [
          { crypto: 'BTC', fiat: 'USD', rate: 88375.98, timestamp: '2025-01-01T00:00:00.000Z' },
          { crypto: 'ETH', fiat: 'EUR', rate: 3245.67, timestamp: '2025-01-01T00:00:00.000Z' }
        ],
        timestamp: '2025-01-01T00:00:00.000Z'
      };

      mockContext.req.json.resolves(requestBody);
      serviceStub.getBatchRates.resolves(mockResponse);

      await getBatchRatesHandler(mockContext);

      expect(serviceStub.getBatchRates.calledOnceWith(requestBody.pairs)).to.be.true;
      expect(mockContext.json.calledOnceWith(mockResponse)).to.be.true;
    });

    it('should handle invalid request body', async () => {
      mockContext.req.json.resolves({});

      await getBatchRatesHandler(mockContext);

      expect(mockContext.status.calledWith(400)).to.be.true;
      expect(mockContext.json.calledWith(sinon.match({
        error: 'Invalid request body'
      }))).to.be.true;
    });

    it('should handle service errors in batch requests', async () => {
      const requestBody = {
        pairs: [{ crypto: 'BTC', fiat: 'USD' }]
      };
      const error = new Error('Batch service error');

      mockContext.req.json.resolves(requestBody);
      serviceStub.getBatchRates.rejects(error);

      await getBatchRatesHandler(mockContext);

      expect(mockContext.status.calledWith(500)).to.be.true;
      expect(mockContext.json.calledWith(sinon.match({
        error: 'Failed to fetch batch exchange rates',
        message: 'Batch service error'
      }))).to.be.true;
    });
  });

  describe('getSupportedCurrenciesHandler', () => {
    it('should return supported currencies', async () => {
      const mockCryptos = ['BTC', 'ETH', 'ADA'];
      const mockFiats = ['USD', 'EUR', 'GBP'];

      serviceStub.getSupportedCryptos.returns(mockCryptos);
      serviceStub.getSupportedFiats.returns(mockFiats);

      await getSupportedCurrenciesHandler(mockContext);

      expect(mockContext.json.calledOnceWith({
        cryptos: mockCryptos,
        fiats: mockFiats
      })).to.be.true;
    });
  });

  describe('Route Configuration', () => {
    it('should export correct route configurations', () => {
      expect(exchangeRateRoutes).to.be.an('array');
      expect(exchangeRateRoutes).to.have.length(3);

      // Check GET single rate route
      const getSingleRoute = exchangeRateRoutes.find(r => 
        r.method === 'GET' && r.path === '/api/exchange-rates/:crypto/:fiat'
      );
      expect(getSingleRoute).to.exist;
      expect(getSingleRoute.handler).to.equal(getSingleRateHandler);

      // Check POST batch rates route
      const getBatchRoute = exchangeRateRoutes.find(r => 
        r.method === 'POST' && r.path === '/api/exchange-rates'
      );
      expect(getBatchRoute).to.exist;
      expect(getBatchRoute.handler).to.equal(getBatchRatesHandler);

      // Check GET supported currencies route
      const getSupportedRoute = exchangeRateRoutes.find(r => 
        r.method === 'GET' && r.path === '/api/exchange-rates/supported'
      );
      expect(getSupportedRoute).to.exist;
      expect(getSupportedRoute.handler).to.equal(getSupportedCurrenciesHandler);
    });
  });
});