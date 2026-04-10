const { sendEmail, sendWhatsApp } = require("../services/messageService");

exports.shareViaEmail = async (req, res) => {
  const { email, link } = req.body;
  if (!email || !link) {
    return res.status(400).json({ message: "Email and link are required" });
  }

  const result = await sendEmail(email, link);
  return res.status(result.success ? 200 : 500).json(result);
};

exports.shareViaWhatsApp = async (req, res) => {
  const { number, link } = req.body;
  if (!number || !link) {
    return res.status(400).json({ message: "Number and link are required" });
  }

  const result = await sendWhatsApp(number, link);
  return res.status(result.success ? 200 : 500).json(result);
};
