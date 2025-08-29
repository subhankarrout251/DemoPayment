const express = require("express");
const router = express.Router();

const books = [
  { id: 1, title: "Maths Notes", description: "Class 10 Mathematics", price: 200, category: "40" },
  { id: 2, title: "Science Notes", description: "Class 10 Science", price: 250, category: "40" },
  { id: 3, title: "English Notes", description: "Class 10 English", price: 150, category: "41" }
];

router.get("/", (req, res) => {
  const { category } = req.query;
  if (category) {
    return res.json(books.filter(book => book.category === category));
  }
  res.json(books);
});

module.exports = router;
