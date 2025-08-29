import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import booksRouter from "./routes/books.js";
import ordersRouter from "./routes/orders.js";
import admissionsRouter from "./routes/admissions.js";
import paymentRouter from "./routes/payment.js";
import adminRouter from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration for production
const allowedOrigins = [
  "http://localhost:5173", // Local development
  "https://your-netlify-site.netlify.app", // Replace with your Netlify URL
  process.env.CLIENT_URL // Environment variable for production
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json({ limit: "2mb" }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure assets/notes directory exists
const assetsDir = path.join(__dirname, "assets", "notes");
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", (_req, res) => res.json({ ok: true, msg: "Coaching Centre API" }));
app.use("/api/books", booksRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admissions", admissionsRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/admin", adminRouter);

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => console.log(`API running on port ${port}`));
