import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Simple in-memory token store
const ACTIVE_TOKENS = new Set();

// Storage for PDFs - lazy directory creation for serverless compatibility
const getNotesDir = () => {
  const notesDir = path.join(__dirname, "..", "assets", "notes");
  if (!fs.existsSync(notesDir)) {
    try {
      fs.mkdirSync(notesDir, { recursive: true });
    } catch (error) {
      console.log("Could not create notes directory:", error.message);
    }
  }
  return notesDir;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getNotesDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || ".pdf").toLowerCase();
    cb(null, `${uuid()}${ext || ".pdf"}`);
  },
});
const upload = multer({ storage });

// Load/save custom books metadata
const dataDir = path.join(__dirname, "..", "data");
const customBooksPath = path.join(dataDir, "customBooks.json");
function readCustomBooks() {
  try {
    if (!fs.existsSync(customBooksPath)) return [];
    const raw = fs.readFileSync(customBooksPath, "utf8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}
function writeCustomBooks(list) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(customBooksPath, JSON.stringify(list, null, 2), "utf8");
  } catch (error) {
    console.log("Could not create data directory:", error.message);
  }
}

// Admin login with password only
router.post("/login", (req, res) => {
  try {
    const { password } = req.body || {};
    const adminPassword = process.env.ADMIN_PASSWORD || "changeme";
    if (!password || password !== adminPassword) {
      return res.status(401).json({ ok: false, error: "INVALID_PASSWORD" });
    }
    const token = uuid();
    ACTIVE_TOKENS.add(token);
    // Auto-expire after 12 hours
    setTimeout(() => ACTIVE_TOKENS.delete(token), 12 * 60 * 60 * 1000).unref?.();
    res.json({ ok: true, data: { token } });
  } catch (e) {
    res.status(500).json({ ok: false, error: "LOGIN_FAILED" });
  }
});

function auth(req, res, next) {
  const authz = req.headers["authorization"] || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token || !ACTIVE_TOKENS.has(token)) {
    return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }
  next();
}

// Storage for cover images - lazy directory creation for serverless compatibility
const getCoversDir = () => {
  const coversDir = path.join(__dirname, "..", "assets", "covers");
  if (!fs.existsSync(coversDir)) {
    try {
      fs.mkdirSync(coversDir, { recursive: true });
    } catch (error) {
      console.log("Could not create covers directory:", error.message);
    }
  }
  return coversDir;
};

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getCoversDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg").toLowerCase();
    cb(null, `${uuid()}${ext || ".jpg"}`);
  },
});
const uploadCover = multer({ storage: coverStorage });

// Upload PDF with price, category, and cover image
router.post("/upload", auth, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), (req, res) => {
  try {
    const { title = "Untitled", price = 0, category = "" } = req.body || {};
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({ ok: false, error: "PDF_FILE_REQUIRED" });
    }

    const pdfFile = req.files.file[0];
    const coverFile = req.files.cover ? req.files.cover[0] : null;
    
    const relPath = path.join("assets", "notes", path.basename(pdfFile.path));
    const coverPath = coverFile ? path.join("assets", "covers", path.basename(coverFile.path)) : null;
    
    const books = readCustomBooks();
    const id = `c-${uuid()}`;
    const item = {
      id,
      title,
      price: Number(price) || 0,
      category: String(category || "").trim(),
      file: relPath,
      cover: coverPath,
      createdAt: Date.now(),
    };
    books.push(item);
    writeCustomBooks(books);
    res.json({ ok: true, data: item });
  } catch (e) {
    console.error("Admin upload failed:", e);
    res.status(500).json({ ok: false, error: "UPLOAD_FAILED" });
  }
});

// Get all categories
router.get("/categories", auth, (req, res) => {
  try {
    const books = readCustomBooks();
    const categories = [...new Set(books.map(b => b.category).filter(Boolean))];
    res.json({ ok: true, data: categories });
  } catch (e) {
    res.status(500).json({ ok: false, error: "FETCH_CATEGORIES_FAILED" });
  }
});

// Get all uploaded books
router.get("/books", auth, (req, res) => {
  try {
    const books = readCustomBooks();
    res.json({ ok: true, data: books });
  } catch (e) {
    res.status(500).json({ ok: false, error: "FETCH_BOOKS_FAILED" });
  }
});

// Delete a book
router.delete("/books/:id", auth, (req, res) => {
  try {
    const { id } = req.params;
    const books = readCustomBooks();
    const bookIndex = books.findIndex(b => b.id === id);
    
    if (bookIndex === -1) {
      return res.status(404).json({ ok: false, error: "BOOK_NOT_FOUND" });
    }

    const book = books[bookIndex];
    
    // Delete the files (PDF and cover)
    if (book.file) {
      const filePath = path.join(__dirname, "..", book.file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    if (book.cover) {
      const coverPath = path.join(__dirname, "..", book.cover);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    // Remove from array
    books.splice(bookIndex, 1);
    writeCustomBooks(books);

    res.json({ ok: true, data: { deleted: id } });
  } catch (e) {
    console.error("Delete book failed:", e);
    res.status(500).json({ ok: false, error: "DELETE_FAILED" });
  }
});

export default router; 