const axios = require('axios');
const db = require('../config/database');

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

class ExchangeRateService {
  constructor() {
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY;
    this.baseUrl = process.env.EXCHANGE_RATE_BASE_URL || 'https://v6.exchangerate-api.com/v6';
  }

  /**
   * Fetch exchange rate from API or cache
   */
  async getRate(baseCurrency = 'USD', targetCurrency) {
    try {
      // Check cache first
      const cached = await this.getCachedRate(baseCurrency, targetCurrency);
      if (cached) {
        return cached;
      }

      // Fetch from API
      const rate = await this.fetchFromAPI(baseCurrency, targetCurrency);
      
      // Cache the result
      await this.cacheRate(baseCurrency, targetCurrency, rate);
      
      return {
        base: baseCurrency,
        target: targetCurrency,
        rate: rate,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Exchange rate fetch error:', error.message);
      
      // Try to return stale cache if API fails
      const staleCache = await this.getCachedRate(baseCurrency, targetCurrency, true);
      if (staleCache) {
        return { ...staleCache, stale: true };
      }
      
      throw new Error(`Unable to fetch exchange rate for ${baseCurrency}/${targetCurrency}`);
    }
  }

  /**
   * Fetch from external API
   */
  async fetchFromAPI(baseCurrency, targetCurrency) {
    // If no API key, use fallback rates for demo
    if (!this.apiKey || this.apiKey === 'your-api-key-here') {
      return this.getFallbackRate(baseCurrency, targetCurrency);
    }

    const response = await axios.get(
      `${this.baseUrl}/${this.apiKey}/pair/${baseCurrency}/${targetCurrency}`,
      { timeout: 10000 }
    );

    if (response.data.result === 'success') {
      return response.data.conversion_rate;
    }

    throw new Error(response.data['error-type'] || 'API error');
  }

  /**
   * Fallback rates for demo/development
   */
  getFallbackRate(base, target) {
    const rates = {
      'USD': {
        'MXN': 17.15,
        'PHP': 55.89,
        'INR': 83.12,
        'COP': 3950.00,
        'GTQ': 7.82,
        'DOP': 58.50,
        'HNL': 24.72,
        'NGN': 1550.00,
        'GHS': 15.20,
        'KES': 153.50,
        'VND': 24500.00,
        'CNY': 7.24,
        'GBP': 0.79,
        'EUR': 0.92,
        'USD': 1.00
      }
    };

    if (rates[base] && rates[base][target]) {
      // Add slight randomization for realism
      const baseRate = rates[base][target];
      const variation = (Math.random() - 0.5) * 0.02 * baseRate;
      return Number((baseRate + variation).toFixed(6));
    }

    throw new Error(`No fallback rate for ${base}/${target}`);
  }

  /**
   * Get cached rate from database
   */
  async getCachedRate(baseCurrency, targetCurrency, ignoreExpiry = false) {
    const query = ignoreExpiry
      ? `SELECT rate, fetched_at FROM exchange_rates 
         WHERE base_currency = $1 AND target_currency = $2`
      : `SELECT rate, fetched_at FROM exchange_rates 
         WHERE base_currency = $1 AND target_currency = $2 
         AND fetched_at > NOW() - INTERVAL '30 minutes'`;

    const result = await db.query(query, [baseCurrency, targetCurrency]);

    if (result.rows.length > 0) {
      return {
        base: baseCurrency,
        target: targetCurrency,
        rate: parseFloat(result.rows[0].rate),
        timestamp: result.rows[0].fetched_at
      };
    }

    return null;
  }

  /**
   * Cache rate in database
   */
  async cacheRate(baseCurrency, targetCurrency, rate) {
    await db.query(
      `INSERT INTO exchange_rates (base_currency, target_currency, rate, fetched_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (base_currency, target_currency)
       DO UPDATE SET rate = $3, fetched_at = NOW()`,
      [baseCurrency, targetCurrency, rate]
    );
  }

  /**
   * Get all rates for supported currencies
   */
  async getAllRates(baseCurrency = 'USD') {
    const currencies = ['MXN', 'PHP', 'INR', 'COP', 'GTQ', 'DOP', 'HNL', 
                        'NGN', 'GHS', 'KES', 'VND', 'CNY', 'GBP', 'EUR'];
    
    const rates = {};
    
    for (const currency of currencies) {
      try {
        const result = await this.getRate(baseCurrency, currency);
        rates[currency] = result.rate;
      } catch (error) {
        console.error(`Failed to get rate for ${currency}:`, error.message);
      }
    }

    return {
      base: baseCurrency,
      rates,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate transfer amounts with fees
   */
  calculateTransfer(sendAmount, exchangeRate, feePercent = 1.5, minimumFee = 2.99) {
    const fee = Math.max(sendAmount * (feePercent / 100), minimumFee);
    const receiveAmount = sendAmount * exchangeRate;
    const totalAmount = sendAmount + fee;

    return {
      sendAmount: Number(sendAmount.toFixed(2)),
      fee: Number(fee.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      exchangeRate: Number(exchangeRate.toFixed(6)),
      receiveAmount: Number(receiveAmount.toFixed(2))
    };
  }
}

module.exports = new ExchangeRateService();
