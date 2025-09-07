import { useState, useEffect } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://demo-payment-nine.vercel.app";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showBooks, setShowBooks] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Login failed");
      setToken(json.data.token);
      fetchBooks(json.data.token);
      fetchCategories(json.data.token);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async (authToken = token) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/books`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (json.ok) setBooks(json.data);
    } catch (err) {
      console.error("Failed to fetch books:", err);
    }
  };

  const fetchCategories = async (authToken = token) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (json.ok) setCategories(json.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!token) return alert("Please login first");
    if (!file) return alert("Please choose a PDF file");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (coverFile) {
        form.append("cover", coverFile);
      }
      form.append("title", title || "Untitled");
      form.append("price", String(price || 0));
      form.append("category", category || "");

      const res = await fetch(`${API_BASE}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Upload failed");
      alert("Uploaded successfully");
      setTitle("");
      setPrice(0);
      setCategory("");
      setFile(null);
      setCoverFile(null);
      fetchBooks();
      fetchCategories();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/books/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Delete failed");
      alert("Book deleted successfully");
      fetchBooks();
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Admin</h1>

      {!token ? (
        <form
          onSubmit={handleLogin}
          className="space-y-4 bg-white p-6 rounded-md shadow"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-md"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setShowBooks(false)}
              className={`pb-2 px-1 ${
                !showBooks
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Upload New Book
            </button>
            <button
              onClick={() => setShowBooks(true)}
              className={`pb-2 px-1 ${
                showBooks
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              Manage Books ({books.length})
            </button>
          </div>

          {!showBooks ? (
            /* Upload Form */
            <form
              onSubmit={handleUpload}
              className="space-y-4 bg-white p-6 rounded-md shadow"
            >
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="space-y-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select or enter new category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter new category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {categories.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        Existing categories:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="w-full mb-2"
                  />
                  {coverFile && (
                    <div className="mt-2">
                      <img
                        src={URL.createObjectURL(coverFile)}
                        alt="Cover preview"
                        className="w-32 h-40 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PDF File
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 rounded-md"
              >
                {loading ? "Uploading..." : "Upload Book"}
              </button>
            </form>
          ) : (
            /* Books Management */
            <div className="bg-white rounded-md shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Uploaded Books</h2>
                {books.length === 0 ? (
                  <p className="text-gray-500">No books uploaded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {books.map((book) => (
                      <div
                        key={book.id}
                        className="border rounded-lg p-4 flex justify-between items-start"
                      >
                        <div className="flex items-start space-x-4 flex-1">
                          {book.cover && (
                            <img
                              src={`${API_BASE}/${book.cover}`}
                              alt={book.title}
                              className="w-16 h-20 object-cover rounded border"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {book.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Price: ₹{book.price}
                            </p>
                            <p className="text-sm text-gray-600">
                              Category: {book.category || "Uncategorized"}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created:{" "}
                              {new Date(book.createdAt).toLocaleDateString()}
                            </p>
                            {book.cover && (
                              <p className="text-xs text-green-600">
                                ✓ Has cover image
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
