const db = require('../src/config/database');

const migrations = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(3) DEFAULT 'USA',
  kyc_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
  kyc_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipients table
CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  relationship VARCHAR(50),
  country VARCHAR(3) NOT NULL,
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_routing_number VARCHAR(50),
  bank_swift_code VARCHAR(20),
  mobile_wallet_provider VARCHAR(100),
  mobile_wallet_number VARCHAR(50),
  delivery_method VARCHAR(50) NOT NULL, -- bank_deposit, mobile_wallet, cash_pickup
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES recipients(id),
  send_amount DECIMAL(12, 2) NOT NULL,
  send_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  receive_amount DECIMAL(12, 2) NOT NULL,
  receive_currency VARCHAR(3) NOT NULL,
  exchange_rate DECIMAL(12, 6) NOT NULL,
  fee_amount DECIMAL(8, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  delivery_method VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled, refunded
  payment_method VARCHAR(50), -- card, bank_transfer, debit
  payment_reference VARCHAR(100),
  estimated_delivery TIMESTAMP,
  completed_at TIMESTAMP,
  failure_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfer status history
CREATE TABLE IF NOT EXISTS transfer_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supported countries
CREATE TABLE IF NOT EXISTS supported_countries (
  id SERIAL PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  flag_emoji VARCHAR(10),
  delivery_methods TEXT[] DEFAULT ARRAY['bank_deposit'],
  min_transfer DECIMAL(10, 2) DEFAULT 10.00,
  max_transfer DECIMAL(10, 2) DEFAULT 10000.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange rate cache
CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  base_currency VARCHAR(3) NOT NULL,
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(12, 6) NOT NULL,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(base_currency, target_currency)
);

-- Payment methods for users
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL, -- card, bank_account
  last_four VARCHAR(4),
  brand VARCHAR(50),
  bank_name VARCHAR(100),
  is_default BOOLEAN DEFAULT false,
  stripe_payment_method_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON transfers(created_at);
CREATE INDEX IF NOT EXISTS idx_recipients_user_id ON recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency);

-- Insert supported countries
INSERT INTO supported_countries (code, name, currency, flag_emoji, delivery_methods) VALUES
  ('MEX', 'Mexico', 'MXN', '🇲🇽', ARRAY['bank_deposit', 'cash_pickup', 'mobile_wallet']),
  ('PHL', 'Philippines', 'PHP', '🇵🇭', ARRAY['bank_deposit', 'cash_pickup', 'mobile_wallet']),
  ('IND', 'India', 'INR', '🇮🇳', ARRAY['bank_deposit', 'mobile_wallet']),
  ('COL', 'Colombia', 'COP', '🇨🇴', ARRAY['bank_deposit', 'cash_pickup']),
  ('GTM', 'Guatemala', 'GTQ', '🇬🇹', ARRAY['bank_deposit', 'cash_pickup']),
  ('DOM', 'Dominican Republic', 'DOP', '🇩🇴', ARRAY['bank_deposit', 'cash_pickup']),
  ('SLV', 'El Salvador', 'USD', '🇸🇻', ARRAY['bank_deposit', 'cash_pickup']),
  ('HND', 'Honduras', 'HNL', '🇭🇳', ARRAY['bank_deposit', 'cash_pickup']),
  ('NGA', 'Nigeria', 'NGN', '🇳🇬', ARRAY['bank_deposit', 'mobile_wallet']),
  ('GHA', 'Ghana', 'GHS', '🇬🇭', ARRAY['bank_deposit', 'mobile_wallet']),
  ('KEN', 'Kenya', 'KES', '🇰🇪', ARRAY['bank_deposit', 'mobile_wallet']),
  ('VNM', 'Vietnam', 'VND', '🇻🇳', ARRAY['bank_deposit']),
  ('CHN', 'China', 'CNY', '🇨🇳', ARRAY['bank_deposit']),
  ('GBR', 'United Kingdom', 'GBP', '🇬🇧', ARRAY['bank_deposit']),
  ('EUR', 'Europe (SEPA)', 'EUR', '🇪🇺', ARRAY['bank_deposit'])
ON CONFLICT (code) DO NOTHING;
`;

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    await db.query(migrations);
    console.log('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
