import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "subhankarrout251@gmail.com",
    pass: process.env.EMAIL_PASS || "iammilu12",
  },
});

// Email templates
const emailTemplates = {
  orderConfirmation: (orderData, customer, items) => ({
    subject: `Order Confirmation - ${orderData.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Order Confirmation</h2>
        <p>Dear ${customer.name},</p>
        <p>Thank you for your order! Here are the details:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Summary</h3>
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>Total Amount:</strong> ₹${orderData.amount}</p>
          <p><strong>Date:</strong> ${new Date(
            orderData.createdAt
          ).toLocaleDateString()}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Items Purchased:</h3>
          ${items
            .map(
              (item) => `
            <div style="border-bottom: 1px solid #e5e7eb; padding: 10px 0;">
              <p><strong>${item.title}</strong></p>
              <p>Quantity: ${item.qty} | Price: ₹${item.price}</p>
            </div>
          `
            )
            .join("")}
        </div>

        <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payment Instructions</h3>
          <p>Please complete your payment using the UPI QR code or link below:</p>
          <p><strong>UPI ID:</strong> ${
            process.env.MERCHANT_UPI || "test@upi"
          }</p>
          <p><strong>Amount:</strong> ₹${orderData.amount}</p>
          <p><strong>Note:</strong> Order ${orderData.orderId}</p>
        </div>

        <p>Once payment is confirmed, you'll receive download links for your notes.</p>
        
        <p>Best regards,<br>Coaching Centre Team</p>
      </div>
    `,
  }),

  paymentSuccess: (orderData, customer, items) => ({
    subject: `Payment Confirmed - Download Your Notes`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payment Confirmed!</h2>
        <p>Dear ${customer.name},</p>
        <p>Great news! Your payment has been confirmed. You can now download your study materials.</p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p><strong>Amount Paid:</strong> ₹${orderData.amount}</p>
          <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Download Your Notes:</h3>
          ${items
            .map(
              (item) => `
            <div style="border: 1px solid #d1d5db; padding: 15px; border-radius: 8px; margin: 10px 0;">
              <p><strong>${item.title}</strong></p>
              <p>Quantity: ${item.qty}</p>
              <a href="${
                process.env.API_BASE ||
                "https://demo-payment-lhgtiuet8-subhankar-rout.vercel.app"
              }/api/orders/${orderData.orderId}/download/${item.id}" 
                 style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Download PDF
              </a>
            </div>
          `
            )
            .join("")}
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Important Notes:</h3>
          <ul>
            <li>Download links are valid for 30 days</li>
            <li>Keep your order ID safe for future reference</li>
            <li>Contact support if you face any issues</li>
          </ul>
        </div>

        <p>Happy studying!<br>Coaching Centre Team</p>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](...data);

    const mailOptions = {
      from: process.env.EMAIL_USER || "your-email@gmail.com",
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

export default { sendEmail };
