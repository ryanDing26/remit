const express = require('express');
const exchangeService = require('../services/exchangeService');

const router = express.Router();

/**
 * GET /api/exchange/rate
 * Get exchange rate for currency pair
 */
router.get('/rate', async (req, res, next) => {
  try {
    const { from = 'USD', to } = req.query;

    if (!to) {
      return res.status(400).json({
        error: 'Missing parameter',
        message: 'Target currency (to) is required'
      });
    }

    const rateData = await exchangeService.getRate(from.toUpperCase(), to.toUpperCase());

    res.json({
      from: rateData.base,
      to: rateData.target,
      rate: rateData.rate,
      timestamp: rateData.timestamp,
      stale: rateData.stale || false
    });
  } catch (error) {
    if (error.message.includes('Unable to fetch')) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: error.message
      });
    }
    next(error);
  }
});

/**
 * GET /api/exchange/rates
 * Get all exchange rates from USD
 */
router.get('/rates', async (req, res, next) => {
  try {
    const { base = 'USD' } = req.query;
    const allRates = await exchangeService.getAllRates(base.toUpperCase());

    res.json(allRates);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/exchange/calculate
 * Calculate transfer amount with fees
 */
router.post('/calculate', async (req, res, next) => {
  try {
    const { amount, from = 'USD', to } = req.body;

    if (!amount || !to) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'Amount and target currency (to) are required'
      });
    }

    const sendAmount = parseFloat(amount);
    if (isNaN(sendAmount) || sendAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount',
        message: 'Amount must be a positive number'
      });
    }

    // Get rate
    const rateData = await exchangeService.getRate(from.toUpperCase(), to.toUpperCase());

    // Calculate with fees
    const feePercent = parseFloat(process.env.SERVICE_FEE_PERCENT) || 1.5;
    const minFee = parseFloat(process.env.MINIMUM_FEE) || 2.99;
    
    const calculation = exchangeService.calculateTransfer(
      sendAmount,
      rateData.rate,
      feePercent,
      minFee
    );

    res.json({
      sendAmount: calculation.sendAmount,
      sendCurrency: from.toUpperCase(),
      receiveAmount: calculation.receiveAmount,
      receiveCurrency: to.toUpperCase(),
      exchangeRate: calculation.exchangeRate,
      fee: calculation.fee,
      feePercent: feePercent,
      totalToPay: calculation.totalAmount,
      rateTimestamp: rateData.timestamp
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
