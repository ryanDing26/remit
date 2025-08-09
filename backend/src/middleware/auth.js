const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database
    const result = await db.query(
      'SELECT id, email, first_name, last_name, kyc_status FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }
    
    next(error);
  }
};

// Middleware to check if user has completed KYC
const requireKYC = (req, res, next) => {
  if (req.user.kyc_status !== 'verified') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'KYC verification required to perform this action',
      kyc_status: req.user.kyc_status
    });
  }
  next();
};

module.exports = { authenticate, requireKYC };
