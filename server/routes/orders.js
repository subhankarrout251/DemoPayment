import { Router } from "express";
import { v4 as uuid } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { buildUpiUri, generateQrPngDataUrl } from "../utils/qr.js";
import { books } from "../data/books.js";
import { sendEmail } from "../utils/email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// In-memory store for demo
const ORDERS = new Map();
const DATA_DIR = path.join(__dirname, "..", "data");
const ORDERS_PATH = path.join(DATA_DIR, "orders.json");

function loadOrdersFromDisk() {
  try {
    if (!fs.existsSync(ORDERS_PATH)) return;
    const raw = fs.readFileSync(ORDERS_PATH, "utf8");
    const list = JSON.parse(raw || "[]");
    if (Array.isArray(list)) {
      ORDERS.clear();
      for (const rec of list) {
        if (rec && rec.orderId) ORDERS.set(rec.orderId, rec);
      }
    }
  } catch (e) {
    console.error("Failed to load orders.json:", e);
  }
}

function saveOrdersToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const list = Array.from(ORDERS.values());
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(list, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to save orders.json:", e);
  }
}

function readCustomBooks() {
  try {
    const p = path.join(DATA_DIR, "customBooks.json");
    if (!fs.existsSync(p)) return [];
    const raw = fs.readFileSync(p, "utf8");
    const list = JSON.parse(raw || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Load existing orders at startup
loadOrdersFromDisk();

/** Create order and return UPI QR */
// POST /api/orders
// body: { items: [{id, title, price, qty}], customer: { name, phone }, meta? }
router.post("/", async (req, res) => {
  try {
    const { items = [], customer = {}, meta = {} } = req.body || {};
    const amount = items.reduce(
      (sum, it) => sum + Number(it.price) * Number(it.qty || 1),
      0
    );

    const orderId = uuid();
    const upiUri = buildUpiUri({
      vpa: process.env.MERCHANT_UPI || "test@upi",
      name: process.env.MERCHANT_NAME || "Coaching Centre",
      amount,
      currency: process.env.CURRENCY || "INR",
      note: process.env.PAYMENT_NOTE || `Order ${orderId}`,
    });
    const qrDataUrl = await generateQrPngDataUrl(upiUri);

    const record = {
      orderId,
      items,
      customer,
      amount,
      status: "PENDING",
      upiUri,
      createdAt: Date.now(),
      meta,
    };
    ORDERS.set(orderId, record);
    saveOrdersToDisk();

    // Send order confirmation email
    if (customer.email) {
      try {
        await sendEmail(customer.email, "orderConfirmation", [record, customer, items]);
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
      }
    }

    res.json({ ok: true, data: { orderId, amount, upiUri, qrDataUrl } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "ORDER_CREATE_FAILED" });
  }
});

/** Confirm payment (manual demo) */
// POST /api/orders/:orderId/confirm  body: { utr, note }
router.post("/:orderId/confirm", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { utr, note } = req.body || {};

    // Validate payment details
    if (!utr || typeof utr !== 'string' || utr.trim().length < 5) {
      return res.status(400).json({ 
        ok: false, 
        error: "INVALID_UTR", 
        message: "UTR/Transaction reference must be at least 5 characters long" 
      });
    }

    // ensure memory is hydrated
    if (!ORDERS.size) loadOrdersFromDisk();

    const rec = ORDERS.get(orderId);
    if (!rec) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    rec.status = "PAID";
    rec.payment = { 
      utr: utr.trim(), 
      note: note || "", 
      confirmedAt: Date.now() 
    };
    ORDERS.set(orderId, rec);
    saveOrdersToDisk();

    // Send payment success email with download links
    if (rec.customer.email) {
      try {
        await sendEmail(rec.customer.email, "paymentSuccess", [rec, rec.customer, rec.items]);
      } catch (emailError) {
        console.error("Failed to send payment success email:", emailError);
      }
    }

    res.json({ ok: true, data: rec });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    res.status(500).json({ ok: false, error: "PAYMENT_CONFIRMATION_FAILED" });
  }
});

/** Fetch order */
router.get("/:orderId", (req, res) => {
  if (!ORDERS.size) loadOrdersFromDisk();
  const rec = ORDERS.get(req.params.orderId);
  if (!rec) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  res.json({ ok: true, data: rec });
});

/** Protected download for a purchased note */
// GET /api/orders/:orderId/download/:itemId
router.get("/:orderId/download/:itemId", (req, res) => {
  const { orderId, itemId } = req.params;
  if (!ORDERS.size) loadOrdersFromDisk();
  const rec = ORDERS.get(orderId);
  if (!rec) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  if (rec.status !== "PAID") {
    return res.status(403).json({ ok: false, error: "PAYMENT_REQUIRED" });
  }
  const itemInOrder = (rec.items || []).find(
    (it) => String(it.id) === String(itemId)
  );
  if (!itemInOrder) {
    return res.status(403).json({ ok: false, error: "ITEM_NOT_IN_ORDER" });
  }

  // Lookup file from static and custom books
  const customBooks = readCustomBooks();
  const allBooks = [...books, ...customBooks];
  const book = allBooks.find((b) => String(b.id) === String(itemId));
  if (!book || !book.file) {
    return res.status(404).json({ ok: false, error: "FILE_NOT_FOUND" });
  }

  const filePath = path.join(__dirname, "..", book.file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ ok: false, error: "FILE_MISSING" });
  }

  res.download(filePath, path.basename(filePath));
});

export default router;
