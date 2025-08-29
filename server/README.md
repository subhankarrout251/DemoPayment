# Coaching Centre Server

## Email Configuration

To enable email functionality, you need to set up the following environment variables:

### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"

### Environment Variables

Create a `.env` file in the server directory with:

```bash
# Server Configuration
PORT=8080
CORS_ORIGIN=http://localhost:5173

# UPI Payment Configuration
MERCHANT_UPI=your-upi-id@upi
MERCHANT_NAME=Your Business Name
CURRENCY=INR
PAYMENT_NOTE=Order payment

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# API Base URL for email links
API_BASE=https://demo-payment-lhgtiuet8-subhankar-rout.vercel.app
```

## Features

- **Order Creation**: Sends confirmation email with payment instructions
- **Payment Confirmation**: Sends success email with download links
- **Protected Downloads**: Only paid orders can download notes
- **File Management**: Serves notes from `/assets/notes/` directory

## API Endpoints

- `POST /api/orders` - Create order (sends confirmation email)
- `POST /api/orders/:id/confirm` - Confirm payment (sends success email)
- `GET /api/orders/:id/download/:itemId` - Download purchased note
- `GET /api/books` - List available books
- `GET /api/payment` - Generate payment QR code

## File Structure

```
server/
├── assets/
│   └── notes/          # Place PDF files here (1.pdf, 2.pdf, etc.)
├── uploads/            # Admission form uploads
├── routes/             # API route handlers
├── utils/              # Utilities (QR, email)
└── data/               # Book data
```
