# PhonePe Payment Gateway Integration

This document explains the PhonePe payment gateway integration implemented in both the client and server folders.

## Server Implementation

### Dependencies Added
- `pg-sdk-node`: PhonePe's official Node.js SDK

### Environment Variables
Add these to your `.env` file:
```
PHONEPE_CLIENT_ID=TEST-M234MAQ6N4ZOI_25082
PHONEPE_CLIENT_SECRET=MzIwNmZiYTEtZGQyZC00ZmQ1LWI1YTktM2I1NzkzYzE5MDAy
PHONEPE_ENV=SANDBOX
CLIENT_URL=http://localhost:5173
```

### API Endpoints
- `POST /api/payment/phonepe/create-order` - Creates a new payment order
- `GET /api/payment/phonepe/check-status` - Checks payment status

## Client Implementation

### Dependencies Added
- `axios`: For HTTP requests

### Components Created
1. `PhonePePayment.jsx` - Standalone payment component
2. `PhonePeCheckout.jsx` - Integrated checkout component
3. `PaymentStatus.jsx` - Payment status checking page

### Routes Added
- `/phonepe-payment` - Standalone PhonePe payment page
- `/payment/check-status` - Payment status verification page

## How It Works

1. **Order Creation**: User fills checkout form and clicks "Proceed to Payment"
2. **Payment Initiation**: Server creates PhonePe order using SDK
3. **Redirect**: User is redirected to PhonePe payment page
4. **Payment Processing**: User completes payment on PhonePe
5. **Status Check**: User is redirected back to status page
6. **Verification**: Server checks payment status with PhonePe

## Testing

1. Start the server: `cd server && npm run dev`
2. Start the client: `cd client && npm run dev`
3. Navigate to `/phonepe-payment` for standalone testing
4. Or use the regular checkout flow with PhonePe integration

## Production Setup

1. Change `Env.SANDBOX` to `Env.PRODUCTION` in `server/routes/payment.js`
2. Update environment variables with production credentials
3. Update redirect URLs to production domains

## Security Notes

- All sensitive credentials are stored in environment variables
- PhonePe SDK handles encryption and security
- Payment verification is done server-side
- No sensitive payment data is stored locally
