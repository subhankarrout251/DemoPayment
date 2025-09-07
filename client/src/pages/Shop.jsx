// client/src/pages/Shop.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchBooks } from "../lib/api";
import BookCart from "../components/BookCart";
import { useCart } from "../../context/CartContext";

export default function Shop() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get("category") || ""; // empty = all
  const { addToCart } = useCart();

  // Redirect to "All" category on initial load
  useEffect(() => {
    if (searchParams.get("category")) {
      navigate("/shop", { replace: true });
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBooks(category)
      .then((list) => {
        setBooks(list);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching books:", error);
        setLoading(false);
      });
  }, [category]);

  const [categories, setCategories] = useState([
    { id: "", name: "All" },
    { id: "40", name: "Class 11-12" },
    { id: "30", name: "Competitive Exams" },
    { id: "20", name: "Foundation Courses" },
  ]);

  // Fetch dynamic categories from admin uploads
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL ||
            "https://demo-payment-nine.vercel.app"
          }/api/books`
        );
        const data = await response.json();
        if (data.ok) {
          const dynamicCategories = [
            ...new Set(data.data.map((book) => book.category).filter(Boolean)),
          ];
          const allCategories = [
            { id: "", name: "All" },
            { id: "40", name: "Class 11-12" },
            { id: "30", name: "Competitive Exams" },
            { id: "20", name: "Foundation Courses" },
            ...dynamicCategories.map((cat) => ({ id: cat, name: cat })),
          ];
          setCategories(allCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
          Study Materials Shop
        </h1>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <a
              key={cat.id || "all"}
              href={cat.id ? `/shop?category=${cat.id}` : "/shop"}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                category === cat.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {cat.name}
            </a>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <BookCart key={book.id} book={book} onAdd={() => addToCart(book)} />
          ))}
        </div>
      )}

      {!loading && books.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No books available in this category.
          </p>
        </div>
      )}
    </div>
  );
}
