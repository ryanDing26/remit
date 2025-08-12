const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/recipients
 * List all recipients for current user
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.*, sc.name as country_name, sc.currency, sc.flag_emoji
       FROM recipients r
       LEFT JOIN supported_countries sc ON r.country = sc.code
       WHERE r.user_id = $1 AND r.is_active = true
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    const recipients = result.rows.map(r => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      fullName: `${r.first_name} ${r.last_name}`,
      email: r.email,
      phone: r.phone,
      relationship: r.relationship,
      country: {
        code: r.country,
        name: r.country_name,
        currency: r.currency,
        flag: r.flag_emoji
      },
      deliveryMethod: r.delivery_method,
      bankDetails: r.delivery_method === 'bank_deposit' ? {
        bankName: r.bank_name,
        accountNumber: r.bank_account_number ? `****${r.bank_account_number.slice(-4)}` : null,
        swiftCode: r.bank_swift_code
      } : null,
      mobileWallet: r.delivery_method === 'mobile_wallet' ? {
        provider: r.mobile_wallet_provider,
        number: r.mobile_wallet_number
      } : null,
      createdAt: r.created_at
    }));

    res.json({ recipients });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recipients/:id
 * Get single recipient
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT r.*, sc.name as country_name, sc.currency, sc.flag_emoji
       FROM recipients r
       LEFT JOIN supported_countries sc ON r.country = sc.code
       WHERE r.id = $1 AND r.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const r = result.rows[0];
    res.json({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      phone: r.phone,
      relationship: r.relationship,
      country: {
        code: r.country,
        name: r.country_name,
        currency: r.currency,
        flag: r.flag_emoji
      },
      deliveryMethod: r.delivery_method,
      bankDetails: {
        bankName: r.bank_name,
        accountNumber: r.bank_account_number,
        routingNumber: r.bank_routing_number,
        swiftCode: r.bank_swift_code
      },
      mobileWallet: {
        provider: r.mobile_wallet_provider,
        number: r.mobile_wallet_number
      },
      address: {
        line1: r.address_line1,
        city: r.city
      },
      createdAt: r.created_at
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/recipients
 * Create new recipient
 */
router.post('/', authenticate, [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('country').isLength({ min: 3, max: 3 }),
  body('deliveryMethod').isIn(['bank_deposit', 'mobile_wallet', 'cash_pickup']),
  body('email').optional().isEmail(),
  body('phone').optional().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      firstName, lastName, email, phone, relationship, country,
      deliveryMethod, bankName, bankAccountNumber, bankRoutingNumber,
      bankSwiftCode, mobileWalletProvider, mobileWalletNumber,
      addressLine1, city
    } = req.body;

    // Validate country exists and supports delivery method
    const countryCheck = await db.query(
      `SELECT * FROM supported_countries WHERE code = $1 AND is_active = true`,
      [country]
    );

    if (countryCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Unsupported country' });
    }

    const supportedMethods = countryCheck.rows[0].delivery_methods;
    if (!supportedMethods.includes(deliveryMethod)) {
      return res.status(400).json({
        error: 'Invalid delivery method',
        message: `${deliveryMethod} is not available for ${countryCheck.rows[0].name}`,
        supportedMethods
      });
    }

    // Validate required fields based on delivery method
    if (deliveryMethod === 'bank_deposit' && !bankAccountNumber) {
      return res.status(400).json({ error: 'Bank account number required for bank deposits' });
    }
    if (deliveryMethod === 'mobile_wallet' && (!mobileWalletProvider || !mobileWalletNumber)) {
      return res.status(400).json({ error: 'Mobile wallet details required' });
    }

    const result = await db.query(
      `INSERT INTO recipients (
        user_id, first_name, last_name, email, phone, relationship, country,
        delivery_method, bank_name, bank_account_number, bank_routing_number,
        bank_swift_code, mobile_wallet_provider, mobile_wallet_number,
        address_line1, city
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        req.user.id, firstName, lastName, email || null, phone || null,
        relationship || null, country, deliveryMethod, bankName || null,
        bankAccountNumber || null, bankRoutingNumber || null, bankSwiftCode || null,
        mobileWalletProvider || null, mobileWalletNumber || null,
        addressLine1 || null, city || null
      ]
    );

    const r = result.rows[0];
    res.status(201).json({
      message: 'Recipient added successfully',
      recipient: {
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        country: r.country,
        deliveryMethod: r.delivery_method,
        createdAt: r.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/recipients/:id
 * Update recipient
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    // Verify ownership
    const ownership = await db.query(
      'SELECT id FROM recipients WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (ownership.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const {
      firstName, lastName, email, phone, relationship,
      bankName, bankAccountNumber, bankSwiftCode,
      mobileWalletProvider, mobileWalletNumber
    } = req.body;

    const result = await db.query(
      `UPDATE recipients SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        relationship = COALESCE($5, relationship),
        bank_name = COALESCE($6, bank_name),
        bank_account_number = COALESCE($7, bank_account_number),
        bank_swift_code = COALESCE($8, bank_swift_code),
        mobile_wallet_provider = COALESCE($9, mobile_wallet_provider),
        mobile_wallet_number = COALESCE($10, mobile_wallet_number),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *`,
      [
        firstName, lastName, email, phone, relationship,
        bankName, bankAccountNumber, bankSwiftCode,
        mobileWalletProvider, mobileWalletNumber,
        req.params.id
      ]
    );

    res.json({
      message: 'Recipient updated successfully',
      recipient: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/recipients/:id
 * Soft delete recipient
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE recipients SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    res.json({ message: 'Recipient removed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
