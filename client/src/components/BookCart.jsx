// client/src/components/BookCart.jsx
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://demo-payment-lhgtiuet8-subhankar-rout.vercel.app";

export default function BookCart({ book, onAdd }) {
  const handleAddToCart = () => {
    onAdd(book);

    // Show success popup
    const popup = document.createElement("div");
    popup.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300";
    popup.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Added to cart successfully!</span>
      </div>
    `;

    document.body.appendChild(popup);

    // Animate in
    setTimeout(() => {
      popup.style.transform = "translateX(0)";
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      popup.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (document.body.contains(popup)) {
          document.body.removeChild(popup);
        }
      }, 300);
    }, 3000);
  };

  const coverImage = book.cover
    ? book.cover.startsWith("http")
      ? book.cover
      : `${API_BASE}/${book.cover}`
    : "/api/placeholder/300/400";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={coverImage}
        alt={book.title}
        className="w-full h-48 object-cover"
        onError={(e) => {
          e.target.src = "/api/placeholder/300/400";
        }}
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 text-gray-900">
          {book.title}
        </h3>
        <p className="text-blue-600 font-bold text-xl mb-4">₹{book.price}</p>
        <button
          onClick={handleAddToCart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
