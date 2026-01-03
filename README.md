# RemitFlow - International Money Transfer Application

A full-stack remittance application similar to Remitly, built with Node.js/Express backend, PostgreSQL database, and React frontend.

[Live Site](https://remit-five.vercel.app/)

## Features

- **User Authentication**: JWT-based auth with secure password hashing
- **Real-time Exchange Rates**: Integration with exchangerate-api.com
- **Transfer Management**: Create, track, and manage international transfers
- **Recipient Management**: Save and manage multiple recipients
- **KYC Verification**: Identity verification workflow
- **Multiple Delivery Methods**: Bank deposit, mobile wallet, cash pickup
- **15+ Supported Countries**: Mexico, Philippines, India, Colombia, and more
- **Responsive Design**: Modern dark-themed UI with custom design system

## Tech Stack

### Backend
- Node.js + Express.js
- PostgreSQL database
- JWT authentication
- bcrypt password hashing
- Helmet.js for security

### Frontend
- React 18 with Vite
- React Router v6
- React Hook Form
- Tailwind CSS with custom design system
- Lucide React icons
- date-fns for date formatting

## Project Structure

```
remittance-app/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── migrations/
│   │   └── run.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── countries.js
│   │   ├── exchange.js
│   │   ├── recipients.js
│   │   ├── transfers.js
│   │   └── users.js
│   ├── services/
│   │   └── exchangeService.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── layout/
    │   │       ├── AuthLayout.jsx
    │   │       └── MainLayout.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   └── useData.js
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── Landing.jsx
    │   │   ├── Login.jsx
    │   │   ├── Recipients.jsx
    │   │   ├── Register.jsx
    │   │   ├── SendMoney.jsx
    │   │   ├── Settings.jsx
    │   │   ├── TrackTransfer.jsx
    │   │   ├── TransferDetails.jsx
    │   │   └── TransferHistory.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── styles/
    │   │   └── index.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=remitflow
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d

   # Exchange Rate API (optional - has fallback rates)
   EXCHANGE_RATE_API_KEY=your_api_key

   # Server
   PORT=3001
   NODE_ENV=development
   ```

5. Create the database:
   ```bash
   createdb remitflow
   ```

6. Run database migrations:
   ```bash
   node migrations/run.js
   ```

7. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 in your browser

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Users
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/address` - Update address
- `POST /api/users/kyc` - Submit KYC
- `GET /api/users/kyc/status` - Get KYC status
- `GET /api/users/stats` - Get transfer statistics

### Recipients
- `GET /api/recipients` - List recipients
- `POST /api/recipients` - Create recipient
- `GET /api/recipients/:id` - Get recipient
- `PUT /api/recipients/:id` - Update recipient
- `DELETE /api/recipients/:id` - Delete recipient

### Transfers
- `POST /api/transfers/quote` - Get transfer quote
- `POST /api/transfers` - Create transfer
- `GET /api/transfers` - List transfers (paginated)
- `GET /api/transfers/:id` - Get transfer details
- `GET /api/transfers/track/:reference` - Track by reference (public)
- `POST /api/transfers/:id/cancel` - Cancel transfer

### Exchange Rates
- `GET /api/exchange/rates` - Get all rates
- `GET /api/exchange/rate/:currency` - Get specific rate
- `POST /api/exchange/calculate` - Calculate conversion

### Countries
- `GET /api/countries` - List supported countries
- `GET /api/countries/:code` - Get country details

## Demo Credentials

Use these credentials to test the application:

- **Email**: demo@remitflow.com
- **Password**: Demo123!

## Supported Countries

| Country | Currency | Delivery Methods |
|---------|----------|-----------------|
| Mexico | MXN | Bank, Mobile, Cash |
| Philippines | PHP | Bank, Mobile, Cash |
| India | INR | Bank, Mobile |
| Colombia | COP | Bank, Cash |
| Guatemala | GTQ | Bank, Cash |
| Dominican Republic | DOP | Bank, Cash |
| El Salvador | USD | Bank, Cash |
| Honduras | HNL | Bank, Cash |
| Nigeria | NGN | Bank, Mobile |
| Ghana | GHS | Bank, Mobile |
| Kenya | KES | Bank, Mobile |
| Vietnam | VND | Bank |
| China | CNY | Bank |
| United Kingdom | GBP | Bank |
| Europe (SEPA) | EUR | Bank |

## Fee Structure

- **Percentage Fee**: 1.5% of transfer amount
- **Minimum Fee**: $2.99
- **Maximum Fee**: None
