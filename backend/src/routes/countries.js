const express = require('express');
const db = require('../config/database');

const router = express.Router();

/**
 * GET /api/countries
 * List all supported countries
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT code, name, currency, flag_emoji, delivery_methods, 
              min_transfer, max_transfer
       FROM supported_countries 
       WHERE is_active = true
       ORDER BY name ASC`
    );

    const countries = result.rows.map(c => ({
      code: c.code,
      name: c.name,
      currency: c.currency,
      flag: c.flag_emoji,
      deliveryMethods: c.delivery_methods,
      limits: {
        min: parseFloat(c.min_transfer),
        max: parseFloat(c.max_transfer)
      }
    }));

    res.json({ countries });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/countries/:code
 * Get single country details
 */
router.get('/:code', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM supported_countries WHERE code = $1 AND is_active = true`,
      [req.params.code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Country not supported' });
    }

    const c = result.rows[0];

    res.json({
      code: c.code,
      name: c.name,
      currency: c.currency,
      flag: c.flag_emoji,
      deliveryMethods: c.delivery_methods,
      limits: {
        min: parseFloat(c.min_transfer),
        max: parseFloat(c.max_transfer)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/countries/:code/delivery-methods
 * Get delivery methods for a country
 */
router.get('/:code/delivery-methods', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT delivery_methods FROM supported_countries WHERE code = $1 AND is_active = true`,
      [req.params.code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Country not supported' });
    }

    const methods = result.rows[0].delivery_methods;

    const methodDetails = methods.map(method => ({
      id: method,
      name: formatMethodName(method),
      estimatedDelivery: getDeliveryEstimate(method),
      description: getMethodDescription(method)
    }));

    res.json({ deliveryMethods: methodDetails });
  } catch (error) {
    next(error);
  }
});

function formatMethodName(method) {
  const names = {
    'bank_deposit': 'Bank Deposit',
    'mobile_wallet': 'Mobile Wallet',
    'cash_pickup': 'Cash Pickup'
  };
  return names[method] || method;
}

function getDeliveryEstimate(method) {
  const estimates = {
    'bank_deposit': '1-3 business days',
    'mobile_wallet': 'Within minutes',
    'cash_pickup': 'Within hours'
  };
  return estimates[method] || 'Varies';
}

function getMethodDescription(method) {
  const descriptions = {
    'bank_deposit': 'Transfer directly to recipient\'s bank account',
    'mobile_wallet': 'Send to mobile money wallet (M-Pesa, GCash, etc.)',
    'cash_pickup': 'Recipient picks up cash at partner location'
  };
  return descriptions[method] || '';
}

module.exports = router;
