const nodemailer = require("nodemailer");

// === Email sending service ===
async function sendEmail(email, link) {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Delivery Tracker" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Track Your Delivery",
      text: `You can track your delivery here: ${link}`,
      html: `<p>You can track your delivery here: <a href="${link}">${link}</a></p>`,
    });

    return { success: true, message: "✅ Email sent successfully" };
  } catch (error) {
    console.error("❌ Email send error:", error);
    return { success: false, message: "Failed to send email" };
  }
}

// === WhatsApp sending service (placeholder) ===
async function sendWhatsApp(number, link) {
  try {
    console.log(`📲 Sending WhatsApp to ${number}: Track your delivery here: ${link}`);
    // Later integrate with Twilio / Meta API
    return { success: true, message: `✅ WhatsApp message sent to ${number}` };
  } catch (error) {
    console.error("❌ WhatsApp send error:", error);
    return { success: false, message: "Failed to send WhatsApp message" };
  }
}

module.exports = {
  sendEmail,
  sendWhatsApp,
};
