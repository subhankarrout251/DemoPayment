import { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://demo-payment-lhgtiuet8-subhankar-rout.vercel.app";

export default function PaymentPage() {
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/payment?amount=500`)
      .then((res) => res.json())
      .then((json) => setQrCode(json.data?.qrCode || ""))
      .catch(() => setQrCode(""));
  }, []);

  return (
    <div className="flex flex-col items-center p-10">
      <h2 className="text-2xl font-bold mb-6">Pay via QR Code</h2>
      {qrCode ? (
        <img src={qrCode} alt="QR Code" className="w-64 h-64" />
      ) : (
        <p>Loading QR Code...</p>
      )}
    </div>
  );
}
