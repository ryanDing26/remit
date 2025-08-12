const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticate, requireKYC } = require('../middleware/auth');
const exchangeService = require('../services/exchangeService');

const router = express.Router();

// Generate unique reference number
function generateReferenceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RF${timestamp}${random}`;
}

/**
 * POST /api/transfers/quote
 * Get transfer quote with exchange rate and fees
 */
router.post('/quote', authenticate, [
  body('sendAmount').isFloat({ min: 10 }),
  body('sendCurrency').optional().isLength({ min: 3, max: 3 }),
  body('receiveCurrency').isLength({ min: 3, max: 3 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sendAmount, sendCurrency = 'USD', receiveCurrency } = req.body;

    // Get exchange rate
    const rateData = await exchangeService.getRate(sendCurrency, receiveCurrency);
    
    // Calculate transfer amounts
    const feePercent = parseFloat(process.env.SERVICE_FEE_PERCENT) || 1.5;
    const minFee = parseFloat(process.env.MINIMUM_FEE) || 2.99;
    
    const calculation = exchangeService.calculateTransfer(
      parseFloat(sendAmount),
      rateData.rate,
      feePercent,
      minFee
    );

    res.json({
      quote: {
        sendAmount: calculation.sendAmount,
        sendCurrency,
        receiveAmount: calculation.receiveAmount,
        receiveCurrency,
        exchangeRate: calculation.exchangeRate,
        fee: calculation.fee,
        totalAmount: calculation.totalAmount,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min expiry
      },
      rateInfo: {
        stale: rateData.stale || false,
        timestamp: rateData.timestamp
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/transfers
 * Create new transfer
 */
router.post('/', authenticate, requireKYC, [
  body('recipientId').isUUID(),
  body('sendAmount').isFloat({ min: 10, max: 10000 }),
  body('receiveCurrency').isLength({ min: 3, max: 3 }),
  body('paymentMethod').isIn(['card', 'bank_transfer', 'debit']),
  body('notes').optional().trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, sendAmount, receiveCurrency, paymentMethod, notes } = req.body;
    const sendCurrency = 'USD';

    // Verify recipient belongs to user
    const recipientResult = await db.query(
      `SELECT r.*, sc.currency as country_currency
       FROM recipients r
       JOIN supported_countries sc ON r.country = sc.code
       WHERE r.id = $1 AND r.user_id = $2 AND r.is_active = true`,
      [recipientId, req.user.id]
    );

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const recipient = recipientResult.rows[0];

    // Verify currency matches recipient's country
    if (receiveCurrency !== recipient.country_currency) {
      return res.status(400).json({
        error: 'Currency mismatch',
        message: `Recipient's country uses ${recipient.country_currency}`
      });
    }

    // Get exchange rate
    const rateData = await exchangeService.getRate(sendCurrency, receiveCurrency);
    
    // Calculate amounts
    const feePercent = parseFloat(process.env.SERVICE_FEE_PERCENT) || 1.5;
    const minFee = parseFloat(process.env.MINIMUM_FEE) || 2.99;
    const calculation = exchangeService.calculateTransfer(
      parseFloat(sendAmount),
      rateData.rate,
      feePercent,
      minFee
    );

    // Generate reference number
    const referenceNumber = generateReferenceNumber();

    // Calculate estimated delivery (1-3 business days)
    const deliveryDays = recipient.delivery_method === 'mobile_wallet' ? 1 : 3;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    // Create transfer
    const result = await db.query(
      `INSERT INTO transfers (
        reference_number, user_id, recipient_id, send_amount, send_currency,
        receive_amount, receive_currency, exchange_rate, fee_amount, total_amount,
        delivery_method, payment_method, estimated_delivery, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'processing')
      RETURNING *`,
      [
        referenceNumber, req.user.id, recipientId,
        calculation.sendAmount, sendCurrency,
        calculation.receiveAmount, receiveCurrency,
        calculation.exchangeRate, calculation.fee, calculation.totalAmount,
        recipient.delivery_method, paymentMethod, estimatedDelivery,
        notes || null
      ]
    );

    const transfer = result.rows[0];

    // Record status history
    await db.query(
      `INSERT INTO transfer_status_history (transfer_id, status, notes)
       VALUES ($1, 'processing', 'Transfer initiated')`,
      [transfer.id]
    );

    // In production, this would:
    // 1. Process payment via Stripe/payment processor
    // 2. Submit to partner banking network
    // 3. Queue for compliance review if needed

    res.status(201).json({
      message: 'Transfer initiated successfully',
      transfer: {
        id: transfer.id,
        referenceNumber: transfer.reference_number,
        sendAmount: parseFloat(transfer.send_amount),
        sendCurrency: transfer.send_currency,
        receiveAmount: parseFloat(transfer.receive_amount),
        receiveCurrency: transfer.receive_currency,
        exchangeRate: parseFloat(transfer.exchange_rate),
        fee: parseFloat(transfer.fee_amount),
        totalAmount: parseFloat(transfer.total_amount),
        status: transfer.status,
        estimatedDelivery: transfer.estimated_delivery,
        recipient: {
          name: `${recipient.first_name} ${recipient.last_name}`,
          country: recipient.country,
          deliveryMethod: recipient.delivery_method
        },
        createdAt: transfer.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transfers
 * List user's transfers with pagination and filtering
 */
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  query('recipientId').optional().isUUID()
], async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, recipientId } = req.query;

    let whereClause = 'WHERE t.user_id = $1';
    const params = [req.user.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND t.status = $${paramCount}`;
      params.push(status);
    }

    if (recipientId) {
      paramCount++;
      whereClause += ` AND t.recipient_id = $${paramCount}`;
      params.push(recipientId);
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM transfers t ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get transfers
    params.push(limit, offset);
    const result = await db.query(
      `SELECT t.*, 
              r.first_name as recipient_first_name,
              r.last_name as recipient_last_name,
              r.country as recipient_country,
              sc.name as country_name,
              sc.flag_emoji
       FROM transfers t
       JOIN recipients r ON t.recipient_id = r.id
       LEFT JOIN supported_countries sc ON r.country = sc.code
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    const transfers = result.rows.map(t => ({
      id: t.id,
      referenceNumber: t.reference_number,
      sendAmount: parseFloat(t.send_amount),
      sendCurrency: t.send_currency,
      receiveAmount: parseFloat(t.receive_amount),
      receiveCurrency: t.receive_currency,
      exchangeRate: parseFloat(t.exchange_rate),
      fee: parseFloat(t.fee_amount),
      totalAmount: parseFloat(t.total_amount),
      status: t.status,
      deliveryMethod: t.delivery_method,
      estimatedDelivery: t.estimated_delivery,
      completedAt: t.completed_at,
      recipient: {
        name: `${t.recipient_first_name} ${t.recipient_last_name}`,
        country: t.recipient_country,
        countryName: t.country_name,
        flag: t.flag_emoji
      },
      createdAt: t.created_at
    }));

    res.json({
      transfers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transfers/:id
 * Get single transfer details
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT t.*, 
              r.first_name as recipient_first_name,
              r.last_name as recipient_last_name,
              r.email as recipient_email,
              r.phone as recipient_phone,
              r.country as recipient_country,
              r.delivery_method,
              r.bank_name,
              sc.name as country_name,
              sc.flag_emoji
       FROM transfers t
       JOIN recipients r ON t.recipient_id = r.id
       LEFT JOIN supported_countries sc ON r.country = sc.code
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    const t = result.rows[0];

    // Get status history
    const historyResult = await db.query(
      `SELECT status, notes, created_at
       FROM transfer_status_history
       WHERE transfer_id = $1
       ORDER BY created_at ASC`,
      [t.id]
    );

    res.json({
      id: t.id,
      referenceNumber: t.reference_number,
      sendAmount: parseFloat(t.send_amount),
      sendCurrency: t.send_currency,
      receiveAmount: parseFloat(t.receive_amount),
      receiveCurrency: t.receive_currency,
      exchangeRate: parseFloat(t.exchange_rate),
      fee: parseFloat(t.fee_amount),
      totalAmount: parseFloat(t.total_amount),
      status: t.status,
      paymentMethod: t.payment_method,
      estimatedDelivery: t.estimated_delivery,
      completedAt: t.completed_at,
      failureReason: t.failure_reason,
      notes: t.notes,
      recipient: {
        name: `${t.recipient_first_name} ${t.recipient_last_name}`,
        email: t.recipient_email,
        phone: t.recipient_phone,
        country: t.recipient_country,
        countryName: t.country_name,
        flag: t.flag_emoji,
        deliveryMethod: t.delivery_method,
        bankName: t.bank_name
      },
      statusHistory: historyResult.rows.map(h => ({
        status: h.status,
        notes: h.notes,
        timestamp: h.created_at
      })),
      createdAt: t.created_at
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transfers/track/:reference
 * Track transfer by reference number (public)
 */
router.get('/track/:reference', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT t.reference_number, t.status, t.send_amount, t.send_currency,
              t.receive_amount, t.receive_currency, t.estimated_delivery,
              t.completed_at, t.created_at,
              r.first_name as recipient_first_name,
              sc.name as country_name
       FROM transfers t
       JOIN recipients r ON t.recipient_id = r.id
       LEFT JOIN supported_countries sc ON r.country = sc.code
       WHERE t.reference_number = $1`,
      [req.params.reference.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    const t = result.rows[0];

    // Get status history
    const historyResult = await db.query(
      `SELECT status, created_at
       FROM transfer_status_history
       WHERE transfer_id = (SELECT id FROM transfers WHERE reference_number = $1)
       ORDER BY created_at ASC`,
      [req.params.reference.toUpperCase()]
    );

    res.json({
      referenceNumber: t.reference_number,
      status: t.status,
      recipientFirstName: t.recipient_first_name,
      destinationCountry: t.country_name,
      sendAmount: parseFloat(t.send_amount),
      sendCurrency: t.send_currency,
      receiveAmount: parseFloat(t.receive_amount),
      receiveCurrency: t.receive_currency,
      estimatedDelivery: t.estimated_delivery,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      timeline: historyResult.rows.map(h => ({
        status: h.status,
        timestamp: h.created_at
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/transfers/:id/cancel
 * Cancel pending transfer
 */
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    // Check transfer exists and can be cancelled
    const checkResult = await db.query(
      `SELECT id, status FROM transfers WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    const transfer = checkResult.rows[0];

    if (!['pending', 'processing'].includes(transfer.status)) {
      return res.status(400).json({
        error: 'Cannot cancel',
        message: `Transfer with status '${transfer.status}' cannot be cancelled`
      });
    }

    // Update status
    await db.query(
      `UPDATE transfers SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    );

    // Record in history
    await db.query(
      `INSERT INTO transfer_status_history (transfer_id, status, notes)
       VALUES ($1, 'cancelled', 'Cancelled by user')`,
      [req.params.id]
    );

    res.json({ message: 'Transfer cancelled successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
