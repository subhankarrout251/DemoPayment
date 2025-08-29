import { Link } from "react-router-dom";

export default function PaymentFailure() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-red-600 text-6xl mb-4">✕</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          Unfortunately, your payment could not be completed. You can try again from checkout.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/cart" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">Go to Cart</Link>
          <Link to="/shop" className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-lg">Continue Browsing</Link>
        </div>
      </div>
    </div>
  );
} 