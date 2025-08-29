// client/src/lib/api.js

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function fetchBooks(category) {
  const url = new URL(`${API_BASE}/api/books`);
  if (category) url.searchParams.set("category", String(category));
  const res = await fetch(url.toString());
  const json = await handleResponse(res);
  return json.data || [];
}

export async function createOrder(payload) {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await handleResponse(res);
  return json.data;
}

export async function confirmPayment(orderId, paymentDetails = {}) {
  const res = await fetch(`${API_BASE}/api/orders/${orderId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentDetails),
  });
  const json = await handleResponse(res);
  return json.data;
}

export async function submitAdmission(formData) {
  const res = await fetch(`${API_BASE}/api/admissions`, {
    method: "POST",
    body: formData,
  });
  const json = await handleResponse(res);
  return json.data;
} 