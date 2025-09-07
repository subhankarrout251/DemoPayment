import { Router } from "express";
import { books as staticBooks } from "../data/books.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

function readCustomBooks() {
  try {
    const p = path.join(__dirname, "..", "data", "customBooks.json");
    if (!fs.existsSync(p)) return [];
    const raw = fs.readFileSync(p, "utf8");
    const list = JSON.parse(raw || "[]");
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.log("Custom books not available in serverless environment");
    return [];
  }
}

// GET /api/books?category=40
router.get("/", (req, res) => {
  const { category } = req.query;
  const custom = readCustomBooks();
  const all = [...staticBooks, ...custom];
  const list = category
    ? all.filter((b) => String(b.category) === String(category))
    : all;
  res.json({ ok: true, data: list });
});

export default router;
