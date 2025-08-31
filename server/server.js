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

// Static file serving for serverless environment
try {
  const uploadsDir = path.join(__dirname, "uploads");
  if (fs.existsSync(uploadsDir)) {
    app.use("/uploads", express.static(uploadsDir));
  }
  
  const assetsDir = path.join(__dirname, "assets");
  if (fs.existsSync(assetsDir)) {
    app.use("/assets", express.static(assetsDir));
  }
} catch (error) {
  console.log("Static file directories not available in serverless environment");
}

app.get("/", (_req, res) => res.json({ ok: true, msg: "Coaching Centre API" }));
app.use("/api/books", booksRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admissions", admissionsRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/admin", adminRouter);

const port = process.env.PORT || 8080;

// Export for Vercel serverless
export default app;

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, "0.0.0.0", () => console.log(`API running on port ${port}`));
}
