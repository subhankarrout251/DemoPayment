import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const upload = multer({ storage });

const router = Router();

const FORMS = [];

// POST /api/admissions  (multipart/form-data)
// fields: name, phone, email, course, message, doc (file)
router.post("/", upload.single("doc"), (req, res) => {
  const { name, phone, email, course, message } = req.body || {};
  const doc = req.file ? `/uploads/${req.file.filename}` : null;
  const id = FORMS.length + 1;
  const record = {
    id,
    name,
    phone,
    email,
    course,
    message,
    doc,
    createdAt: Date.now(),
  };
  FORMS.push(record);
  res.json({ ok: true, data: record });
});

// GET /api/admissions (list submissions)
router.get("/", (req, res) => {
  res.json({ ok: true, data: FORMS });
});

export default router;
