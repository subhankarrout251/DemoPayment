import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import booksRouter from "../routes/books.js";
import ordersRouter from "../routes/orders.js";
import admissionsRouter from "../routes/admissions.js";
import paymentRouter from "../routes/payment.js";
import adminRouter from "../routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration for production
const allowedOrigins = [
  "http://localhost:5173",
  "https://phonpedemo1.netlify.app",
  process.env.CLIENT_URL
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
  const assetsDir = path.join(__dirname, "..", "assets");
  app.use("/assets", express.static(assetsDir));
} catch (error) {
  console.log("Static file directories not available in serverless environment");
}

app.get("/", (_req, res) => res.json({ ok: true, msg: "Coaching Centre API" }));
app.use("/api/books", booksRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admissions", admissionsRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/admin", adminRouter);

export default app;
