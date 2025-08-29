import QRCode from "qrcode";

/**
 * Build a UPI deeplink (BHIM intent)
 * Docs: upi://pay?pa=<VPA>&pn=<Name>&am=<Amount>&cu=INR&tn=<Note>
 */
export function buildUpiUri({
  vpa,
  name,
  amount,
  currency = "INR",
  note = "",
}) {
  const params = new URLSearchParams({
    pa: vpa,
    pn: name,
    am: String(amount),
    cu: currency,
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export async function generateQrPngDataUrl(text) {
  return QRCode.toDataURL(text, { margin: 1, scale: 6 });
}
