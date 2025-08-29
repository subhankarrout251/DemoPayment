// client/src/pages/Checkout.jsx
import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { createOrder, confirmPayment, API_BASE } from "../lib/api";
import QRCode from "qrcode.react";

export default function Checkout() {
  const { items, getCartTotal, clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    utr: "",
    note: ""
  });
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = await createOrder({
        items,
        customer,
      });
      setOrder(orderData);
      setPurchasedItems(items);

      // Persist orderId and order payload for success/status fallback pages
      try {
        localStorage.setItem("lastOrderId", orderData.orderId);
        localStorage.setItem(
          "phonepe_order",
          JSON.stringify({ orderId: orderData.orderId, items })
        );
      } catch {}

      // Initiate PhonePe payment and redirect using new implementation
      const res = await fetch(`${API_BASE}/api/payment/phonepe/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: getCartTotal() * 100 }) // Convert to paisa
      });
      const json = await res.json();
      if (!json.ok) {
        console.error("PhonePe init failed details:", json.details || json);
        const human = json.details?.message || json.details?.code || json.error || "Failed to start payment";
        throw new Error(human);
      }
      window.location.href = json.data.checkoutPageUrl;
    } catch (error) {
      console.error("Error starting payment:", error);
      alert(`Failed to start payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirmation = async () => {
    if (!paymentDetails.utr.trim()) {
      alert("Please enter your UTR/Transaction Reference Number");
      return;
    }

    setPaymentLoading(true);
    try {
      await confirmPayment(order.orderId, {
        utr: paymentDetails.utr.trim(),
        note: paymentDetails.note || "Payment confirmed by user"
      });
      setPaymentConfirmed(true);
      clearCart();
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("Failed to confirm payment. Please check your UTR number and try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (paymentConfirmed && order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase! You can now download your notes.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              📧 A confirmation email with download links has been sent to <strong>{customer.email}</strong>
            </p>
          </div>

          <div className="space-y-2 mb-6 text-left">
            {purchasedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span>
                  {item.title} (x{item.qty})
                </span>
                <a
                  href={`${API_BASE}/api/orders/${order.orderId}/download/${item.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Download
                </a>
              </div>
            ))}
          </div>

          <a
            href="/shop"
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-3 rounded-lg font-medium"
          >
            Back to Shop
          </a>
        </div>
      </div>
    );
  }

  if (order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Complete Your Payment
          </h1>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              📧 Order confirmation has been sent to <strong>{customer.email}</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-2 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.title} (x{item.qty})
                    </span>
                    <span>₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total</span>
                  <span>₹{getCartTotal()}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Redirecting to PhonePe...
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                If you are not redirected automatically, please check your pop-up settings and try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={customer.email}
              onChange={(e) =>
                setCustomer({ ...customer, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Order confirmation and payment details will be sent to this email
            </p>
          </div>

          <div>
            <label className="block text.sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={customer.phone}
              onChange={(e) =>
                setCustomer({ ...customer, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              required
              value={customer.address}
              onChange={(e) =>
                setCustomer({ ...customer, address: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-medium mb-4">
              <span>Total Amount</span>
              <span>₹{getCartTotal()}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-6 rounded-lg font-medium"
            >
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
