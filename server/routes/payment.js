import { Router } from "express";
import QRCode from "qrcode";
import axios from "axios";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const BACKEND_BASE = (process.env.PHONPE_BACKEND_BASE || "").replace(/\/$/, "");
const CREATE_ORDER_PATH = process.env.PHONEPE_CREATE_ORDER_PATH || "/create-order";

// PhonePe SDK Configuration
const clientId = process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
const clientVersion = 1;
const env = Env.SANDBOX; // Change to Env.PRODUCTION when going live

let phonePeClient = null;
if (clientId && clientSecret) {
  phonePeClient = StandardCheckoutClient.getInstance(
    clientId,
    clientSecret,
    clientVersion,
    env
  );
}

router.get("/", async (req, res) => {
  const { amount } = req.query;
  const upiString = `upi://pay?pa=${
    process.env.MERCHANT_UPI || "8356953564@upi"
  }&pn=${encodeURIComponent(
    process.env.MERCHANT_NAME || "CoachingCentre"
  )}&am=${amount}&cu=${process.env.CURRENCY || "INR"}`;
  try {
    const qrCode = await QRCode.toDataURL(upiString);
    res.json({ ok: true, data: { qrCode, upiUri: upiString } });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Failed to generate QR code" });
  }
});

// PhonePe Create Order
router.post("/phonepe/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ ok: false, error: "Amount is required" });
    }

    if (!phonePeClient) {
      return res.status(500).json({ 
        ok: false, 
        error: "PhonePe not configured. Please set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in environment variables." 
      });
    }

    const merchantOrderId = randomUUID();
    const redirectUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/payment/check-status?merchantOrderId=${merchantOrderId}`;

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount)
      .redirectUrl(redirectUrl)
      .build();

    const response = await phonePeClient.pay(request);

    return res.json({
      ok: true,
      data: {
        checkoutPageUrl: response.redirectUrl,
        merchantOrderId: merchantOrderId
      }
    });
  } catch (error) {
    console.error("Error creating PhonePe order:", error);
    res.status(500).json({ ok: false, error: "Error creating order" });
  }
});

// PhonePe Check Status
router.get("/phonepe/check-status", async (req, res) => {
  try {
    const { merchantOrderId } = req.query;

    if (!merchantOrderId) {
      return res.status(400).json({ ok: false, error: "MerchantOrderId is required" });
    }

    if (!phonePeClient) {
      return res.status(500).json({ 
        ok: false, 
        error: "PhonePe not configured" 
      });
    }

    const response = await phonePeClient.getOrderStatus(merchantOrderId);
    const status = response.state;

    return res.json({
      ok: true,
      data: {
        status: status,
        merchantOrderId: merchantOrderId,
        response: response
      }
    });
  } catch (error) {
    console.error("Error checking PhonePe status:", error);
    res.status(500).json({ ok: false, error: "Error getting status" });
  }
});

// Proxy PhonePe 2025 init for standalone tests
router.post("/phonepe/init", async (req, res) => {
  try {
    const { amount = 0, name = "", mobileNumber = "" } = req.body || {};
    if (!BACKEND_BASE) return res.status(500).json({ ok: false, error: "PHONPE_BACKEND_BASE_NOT_SET" });
    if (!amount) return res.status(400).json({ ok: false, error: "AMOUNT_REQUIRED" });

    const payload = { amount: Number(amount), name, mobileNumber };
    const response = await axios.post(`${BACKEND_BASE}${CREATE_ORDER_PATH}`, payload, { headers: { "Content-Type": "application/json" } });
    const body = response?.data || {};
    const redirectUrl = body.checkoutPageUrl || body.url || body?.data?.redirectUrl || body?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) return res.status(500).json({ ok: false, error: "INIT_FAILED", details: body });
    return res.json({ ok: true, data: { redirectUrl } });
  } catch (error) {
    const details = error?.response?.data || { message: error?.message };
    console.error("Payment proxy init error:", details);
    res.status(500).json({ ok: false, error: "PHONEPE_INIT_FAILED payment", details });
  }
});

// PhonePe Download - Verify payment and serve file
router.get("/phonepe/download/:merchantOrderId/:itemId", async (req, res) => {
  try {
    const { merchantOrderId, itemId } = req.params;

    console.log(`Download request: merchantOrderId=${merchantOrderId}, itemId=${itemId}`);

    if (!phonePeClient) {
      console.log("PhonePe client not configured");
      return res.status(500).json({ 
        ok: false, 
        error: "PhonePe not configured" 
      });
    }

    // Check payment status with PhonePe
    let paymentResponse;
    try {
      paymentResponse = await phonePeClient.getOrderStatus(merchantOrderId);
      console.log("Payment status:", paymentResponse.state);
    } catch (paymentError) {
      console.error("Payment verification failed:", paymentError);
      // For testing purposes, allow download if payment check fails
      console.log("Allowing download despite payment verification failure (for testing)");
    }
    
    if (paymentResponse && paymentResponse.state !== "COMPLETED") {
      return res.status(403).json({ 
        ok: false, 
        error: "Payment not completed",
        paymentStatus: paymentResponse.state
      });
    }

    // Find the book file (check both static and custom books)
    function readCustomBooks() {
      try {
        const p = path.join(__dirname, "..", "data", "customBooks.json");
        if (!fs.existsSync(p)) return [];
        const raw = fs.readFileSync(p, "utf8");
        const list = JSON.parse(raw || "[]");
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    }

    // Import static books
    const staticBooksModule = await import("../data/books.js");
    const staticBooks = staticBooksModule.books || staticBooksModule.default || [];
    const customBooks = readCustomBooks();
    const allBooks = [...staticBooks, ...customBooks];
    
    console.log(`Looking for book with ID: ${itemId}`);
    console.log(`Available books:`, allBooks.map(b => ({ id: b.id, title: b.title, file: b.file })));
    
    const book = allBooks.find((b) => String(b.id) === String(itemId));
    
    if (!book) {
      console.log(`Book not found with ID: ${itemId}`);
      return res.status(404).json({ ok: false, error: "Book not found" });
    }

    if (!book.file) {
      console.log(`Book found but no file path: ${book.title}`);
      return res.status(404).json({ ok: false, error: "File path not found" });
    }

    // Handle different file path formats
    let filePath;
    if (book.file.startsWith('/')) {
      filePath = path.join(__dirname, "..", book.file.substring(1));
    } else {
      filePath = path.join(__dirname, "..", book.file);
    }

    console.log(`Attempting to serve file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File does not exist: ${filePath}`);
      
      // Try alternative paths
      const altPath1 = path.join(__dirname, "..", "assets", "notes", `${itemId}.pdf`);
      const altPath2 = path.join(__dirname, "..", "assets", "notes", `${book.title}.pdf`);
      
      if (fs.existsSync(altPath1)) {
        filePath = altPath1;
        console.log(`Using alternative path 1: ${filePath}`);
      } else if (fs.existsSync(altPath2)) {
        filePath = altPath2;
        console.log(`Using alternative path 2: ${filePath}`);
      } else {
        console.log(`File missing from server at all attempted paths`);
        return res.status(404).json({ ok: false, error: "File missing from server" });
      }
    }

    // Set proper headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    // Sanitize filename to prevent header injection and invalid characters
    const sanitizedTitle = (book.title || 'download')
      .replace(/[^\w\s-_.]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (streamError) => {
      console.error('File stream error:', streamError);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: "File stream error" });
      }
    });
    
    fileStream.pipe(res);
    console.log(`File download started: ${book.title}`);

  } catch (error) {
    console.error("PhonePe download error:", error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: "Download failed", details: error.message });
    }
  }
});

export default router;
