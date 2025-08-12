const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', authenticate, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('dateOfBirth').optional().isISO8601()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone, dateOfBirth } = req.body;
    
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (firstName) {
      paramCount++;
      updates.push(`first_name = $${paramCount}`);
      values.push(firstName);
    }
    if (lastName) {
      paramCount++;
      updates.push(`last_name = $${paramCount}`);
      values.push(lastName);
    }
    if (phone !== undefined) {
      paramCount++;
      updates.push(`phone = $${paramCount}`);
      values.push(phone);
    }
    if (dateOfBirth) {
      paramCount++;
      updates.push(`date_of_birth = $${paramCount}`);
      values.push(dateOfBirth);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    values.push(req.user.id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount + 1}
       RETURNING id, email, first_name, last_name, phone, date_of_birth`,
      values
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/address
 * Update user address
 */
router.put('/address', authenticate, [
  body('line1').trim().notEmpty(),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('postalCode').trim().notEmpty(),
  body('country').optional().isLength({ min: 2, max: 3 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { line1, line2, city, state, postalCode, country } = req.body;

    const result = await db.query(
      `UPDATE users SET 
        address_line1 = $1,
        address_line2 = $2,
        city = $3,
        state = $4,
        postal_code = $5,
        country = $6,
        updated_at = NOW()
       WHERE id = $7
       RETURNING address_line1, address_line2, city, state, postal_code, country`,
      [line1, line2 || null, city, state, postalCode, country || 'USA', req.user.id]
    );

    res.json({
      message: 'Address updated successfully',
      address: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/kyc/submit
 * Submit KYC verification (simulated)
 */
router.post('/kyc/submit', authenticate, [
  body('documentType').isIn(['passport', 'drivers_license', 'national_id']),
  body('documentNumber').trim().notEmpty(),
  body('dateOfBirth').isISO8601(),
  body('ssn').optional().matches(/^\d{4}$/).withMessage('Last 4 digits of SSN required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already verified
    const user = await db.query(
      'SELECT kyc_status FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows[0].kyc_status === 'verified') {
      return res.status(400).json({
        error: 'Already Verified',
        message: 'Your identity has already been verified'
      });
    }

    // In production, this would integrate with an identity verification service
    // like Jumio, Onfido, or Persona
    // For demo purposes, we'll auto-approve after a delay simulation

    await db.query(
      `UPDATE users SET 
        kyc_status = 'verified',
        kyc_verified_at = NOW(),
        date_of_birth = $1,
        updated_at = NOW()
       WHERE id = $2`,
      [req.body.dateOfBirth, req.user.id]
    );

    res.json({
      message: 'KYC verification submitted successfully',
      status: 'verified',
      verifiedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/kyc/status
 * Get KYC status
 */
router.get('/kyc/status', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT kyc_status, kyc_verified_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      status: result.rows[0].kyc_status,
      verifiedAt: result.rows[0].kyc_verified_at
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/users/stats
 * Get user transfer statistics
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_transfers,
        COALESCE(SUM(send_amount), 0) as total_sent,
        COALESCE(SUM(fee_amount), 0) as total_fees,
        COUNT(DISTINCT recipient_id) as unique_recipients
      FROM transfers 
      WHERE user_id = $1 AND status = 'completed'
    `, [req.user.id]);

    const recentActivity = await db.query(`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as transfers,
        SUM(send_amount) as amount
      FROM transfers 
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `, [req.user.id]);

    res.json({
      summary: {
        totalTransfers: parseInt(stats.rows[0].total_transfers),
        totalSent: parseFloat(stats.rows[0].total_sent),
        totalFees: parseFloat(stats.rows[0].total_fees),
        uniqueRecipients: parseInt(stats.rows[0].unique_recipients)
      },
      monthlyActivity: recentActivity.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
