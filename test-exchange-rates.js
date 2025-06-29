import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base URL for API endpoints
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Test the exchange rate endpoints
 */
async function testExchangeRateEndpoints() {
  console.log('🚀 Starting Exchange Rate API tests...\n');
  
  const results = {
    getSingleRate: false,
    getBatchRates: false,
    getSupportedCurrencies: false
  };

  // Test 1: GET single exchange rate
  try {
    console.log('📊 Testing GET /api/exchange-rates/BTC/USD...');
    const response = await fetch(`${API_BASE_URL}/exchange-rates/BTC/USD`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Single rate response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    if (data.crypto && data.fiat && data.rate && data.timestamp) {
      results.getSingleRate = true;
      console.log('✅ Single rate test PASSED\n');
    } else {
      console.log('❌ Single rate test FAILED - Invalid response structure\n');
    }
  } catch (error) {
    console.log(`❌ Single rate test FAILED: ${error.message}\n`);
  }

  // Test 2: POST batch exchange rates
  try {
    console.log('📊 Testing POST /api/exchange-rates (batch)...');
    const requestBody = {
      pairs: [
        { crypto: 'BTC', fiat: 'USD' },
        { crypto: 'ETH', fiat: 'EUR' },
        { crypto: 'ADA', fiat: 'GBP' }
      ]
    };
    
    const response = await fetch(`${API_BASE_URL}/exchange-rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Batch rates response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    if (data.rates && Array.isArray(data.rates) && data.timestamp) {
      results.getBatchRates = true;
      console.log('✅ Batch rates test PASSED\n');
    } else {
      console.log('❌ Batch rates test FAILED - Invalid response structure\n');
    }
  } catch (error) {
    console.log(`❌ Batch rates test FAILED: ${error.message}\n`);
  }

  // Test 3: GET supported currencies
  try {
    console.log('📊 Testing GET /api/exchange-rates/supported...');
    const response = await fetch(`${API_BASE_URL}/exchange-rates/supported`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Supported currencies response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    if (data.cryptos && Array.isArray(data.cryptos) && data.fiats && Array.isArray(data.fiats)) {
      results.getSupportedCurrencies = true;
      console.log('✅ Supported currencies test PASSED\n');
    } else {
      console.log('❌ Supported currencies test FAILED - Invalid response structure\n');
    }
  } catch (error) {
    console.log(`❌ Supported currencies test FAILED: ${error.message}\n`);
  }

  // Test 4: Error handling - Invalid crypto symbol
  try {
    console.log('📊 Testing error handling with invalid crypto...');
    const response = await fetch(`${API_BASE_URL}/exchange-rates/INVALID/USD`);
    
    if (response.status === 400 || response.status === 500) {
      console.log('✅ Error handling test PASSED - Got expected error status\n');
    } else {
      console.log('❌ Error handling test FAILED - Expected error status\n');
    }
  } catch (error) {
    console.log(`❌ Error handling test FAILED: ${error.message}\n`);
  }

  // Test 5: Error handling - Empty batch request
  try {
    console.log('📊 Testing error handling with empty batch...');
    const response = await fetch(`${API_BASE_URL}/exchange-rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pairs: [] })
    });
    
    if (response.status === 400) {
      console.log('✅ Empty batch error handling test PASSED\n');
    } else {
      console.log('❌ Empty batch error handling test FAILED\n');
    }
  } catch (error) {
    console.log(`❌ Empty batch error handling test FAILED: ${error.message}\n`);
  }

  // Summary
  console.log('📋 Test Results Summary:');
  console.log(`GET Single Rate: ${results.getSingleRate ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`POST Batch Rates: ${results.getBatchRates ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`GET Supported Currencies: ${results.getSupportedCurrencies ? '✅ PASSED' : '❌ FAILED'}`);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All exchange rate tests passed successfully!');
  } else {
    console.log('⚠️  Some exchange rate tests failed. Check the error messages above.');
  }
}

// Wait for the server to start before running the tests
console.log('⏳ Waiting for server to start...');
setTimeout(testExchangeRateEndpoints, 3000);