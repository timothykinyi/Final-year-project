const axios = require("axios");
const moment = require("moment");
require('dotenv').config();
const fs = require("fs");
const Order = require('../models/Delivery');
const PendingJob = require('../models/PendingJob'); 
const { v4: uuidv4 } = require('uuid');
//const getAccessToken = require("../utils/accessToken");


function formatPhoneNumber(phone) {
  if (!phone) return null;

  // Trim spaces just in case
  phone = phone.toString().trim();

  // If number starts with 0, replace with 254
  if (phone.startsWith("0")) {
    return "254" + phone.slice(1);
  }

  // If number already starts with 254, leave it as is
  if (phone.startsWith("254")) {
    return phone;
  }

  // If number starts with +254, strip the + 
  if (phone.startsWith("+254")) {
    return phone.slice(1);
  }

  // If it's in some unexpected format, return null (invalid)
  return null;
}


// Get Access Token Function
async function getAccessToken() {
  const consumer_key = process.env.SAFARICOM_CONSUMER_KEY;
  const consumer_secret = process.env.SAFARICOM_CONSUMER_SECRET;
  const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth = "Basic " + Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
      },
    });
    return response.data.access_token;
  } catch (error) {
    throw error;
  }
}

// Access Token Route Handler
exports.getAccessTokenHandler = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    res.send("😀 Your access token is " + accessToken);
  } catch (error) {
    console.log(error);
    res.status(500).send("❌ Failed to get access token");
  }
};

// STK Push Handler
exports.stkPushHandler = async (req, res) => {
  try {

    const{ amount, mpesaNumber, deliveryId } = req.body;
    const accessToken = await getAccessToken();
    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const passkey = process.env.PASS_KEY;
    const businessShortCode = process.env.BUSINESS_SHORT_CODE;
    const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString('base64');

    const formattedPhone = formatPhoneNumber(mpesaNumber);
    const order = await Order.findById(deliveryId);
    if (!order) {
      console.log("Order not found for ID:", deliveryId);
        return res.status(404).json({ message: 'Order not found' });
    }

    const response = await axios.post(url, {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone, // Phone number to receive the STK push
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: "https://final-year-project-etga.onrender.com/api/mesa/callback",
      AccountReference: `Delivery on Twende`,
      TransactionDesc: 'Payment for Order',
    }, {
      headers: { Authorization: "Bearer " + accessToken }
    });

    order.CheckoutRequestID = response.CheckoutRequestID;
    await order.save();
    res.send("😀 Request is successful. Please enter M-Pesa PIN to complete the transaction");
  } catch (error) {
    console.log(error);
    res.status(500).send("❌ STK Push request failed");
  }
};


// STK Push Handler internal
exports.stkPushHandlerinternal = async (amount, mpesaNumber, deliveryId) => {
  try {
    const accessToken = await getAccessToken();
    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const timestamp = moment().format("YYYYMMDDHHmmss");

    const passkey = process.env.PASS_KEY;
    const businessShortCode = process.env.BUSINESS_SHORT_CODE;

    const password = Buffer.from(
      `${businessShortCode}${passkey}${timestamp}`
    ).toString("base64");

    const formattedPhone = formatPhoneNumber(mpesaNumber);

    const order = await Order.findById(deliveryId);
    if (!order) {
      console.log("Order not found for ID:", deliveryId);

      return {
        success: false,
        error: "Order not found",
      };
    }

    const response = await axios.post(
      url,
      {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: "https://final-year-project-etga.onrender.com/api/mesa/callback",
        AccountReference: "Delivery on Twende",
        TransactionDesc: "Payment for Order",
      },
      {
        headers: { Authorization: "Bearer " + accessToken },
      }
    );

    // ⚠️ FIX HERE TOO
    order.CheckoutRequestID = response.data.CheckoutRequestID;
    await order.save();

    return {
      success: true,
      message: "STK Push sent successfully",
      data: response.data,
    };
  } catch (error) {
    console.error("❌ STK Push error:", error.response?.data || error.message);

    return {
      success: false,
      error:
        error.response?.data?.errorMessage ||
        error.message ||
        "STK Push failed",
    };
  }
};

// STK Push Callback Handler
exports.stkPushCallbackHandler = async (req, res) => {
  const json = JSON.stringify(req.body);
  const callbackData = req.body.Body.stkCallback;
  try {
      await PendingJob.create({ callbackData, processed: false }); // Save unprocessed job
      res.status(200).json({ message: 'Callback received and queued for processing.' });
  } catch (error) {
      console.error("Failed to queue job:", error);
      res.status(500).json({ message: 'Error queuing callback for processing' });
  }
 
};

// Register URL for C2B Handler
// Register URL for C2B Handler
exports.registerURLHandler = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const url = "https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl";
    const response = await axios.post(url, {
      ShortCode: process.env.BUSINESS_SHORT_CODE,
      ResponseType: "Complete",
      ConfirmationURL: "https://elosystemv1.onrender.com/api/newpay/confirmation",
      ValidationURL: "https://elosystemv1.onrender.com/api/newpay/validation",
    }, {
      headers: { Authorization: "Bearer " + accessToken }
    });
    res.status(200).json(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).send("❌ Register URL request failed");
  }
};

// Confirmation URL Handler
exports.confirmURLHandler = (req, res) => {
  console.log("All transactions will be sent to this URL");
  console.log(req.body);
  res.status(200).send("Confirmation received");
};

// Validation URL Handler
exports.validateURLHandler = (req, res) => {
  console.log("Validating payment");
  console.log(req.body);
  res.status(200).send("Validation received");
};

// B2C (Auto Withdrawal) Handler
exports.b2cRequestHandlers = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const securityCredential = process.env.SECURITYCREDENTIAL; // Your Security Credential here
    const url = "https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest";
    const response = await axios.post(url, {
      OriginatorConversationID: uuidv4(),
      InitiatorName: process.env.InitiatoRName,
      SecurityCredential: securityCredential,
      CommandID: "BusinessPayment",
      Amount: "10",
      PartyA: process.env.BUSINESS_SHORT_CODE,
      PartyB: "254742243421", // Phone number to receive funds
      Remarks: "Withdrawal",
      QueueTimeOutURL: "https://elosystemv1.onrender.com/api/newpay/b2c/queue",
      ResultURL: "https://elosystemv1.onrender.com/api/newpay/b2c/result",
      Occasion: "Withdrawal",
    }, {
      headers: { Authorization: "Bearer " + accessToken }
    });
    console.log(response.data);
    res.status(200).send("✅ Payment done succesfully");
  } catch (error) {
    console.log(error.Error);
    res.status(500).send("❌ B2C request failed");
  }
};

exports.b2cRequestHandler = async ( Phonenumber, amount) => {
    try {
      const accessToken = await getAccessToken();
      const initiatoRName = process.env.InitiatoRName;
      const businessShortCode = process.env.BUSINESS_SHORT_CODE;
      const securityCredential = process.env.SECURITYCREDENTIAL; // Your Security Credential here
      const url = "https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest";
      
      const formattedPhone = formatPhoneNumber(Phonenumber);

      const response = await axios.post(url,{
          OriginatorConversationID: uuidv4(),
          InitiatorName: initiatoRName,
          SecurityCredential: securityCredential,
          CommandID: "PromotionPayment",
          Amount: amount,
          PartyA: businessShortCode,
          PartyB: formattedPhone,
          Remarks: "ok",
          occassion: "ok",
          QueueTimeOutURL: "https://final-year-project-etga.onrender.com/api/mesa/queue",
          ResultURL: "https://final-year-project-etga.onrender.com/api/mesa/result"
        } , {
        headers: { Authorization: "Bearer " + accessToken }
      });

      return {
      success: true,
      message: "Withdrawal requested successfull",
      data: response.data,
    };
    } catch (error) {
      console.log(error);
      console.log("❌ B2C request failed");
      return {
        success: false,
        error:
          error.response?.data?.errorMessage ||
          error.message ||
          "B2C request failed",
      };
    }
  };
  
exports.queue = (req, res) => {
    console.log("All queue transactions will be sent to this URL");
    console.log(req.body);
    res.status(200).send("Confirmation queue received");
  };

  exports.result = (req, res) => {
    console.log("All result transactions will be sent to this URL");
    console.log(req.body);
    res.status(200).send("Confirmation result received");
  };

/*   exports.b2cRequestHandler = async (Amount, Phonenumber) => {
    try {
      const accessToken = await getAccessToken();
      const securityCredential = process.env.SECURITYCREDENTIAL; // Your Security Credential here
      const url = "https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest";
      const response = await axios.post(url, {
        OriginatorConversationID: uuidv4(),
        InitiatorName: process.env.InitiatoRName,
        SecurityCredential: securityCredential,
        CommandID: "BusinessPayment",
        Amount: Amount,
        PartyA: process.env.BUSINESS_SHORT_CODE,
        PartyB: Phonenumber, // Phone number to receive funds
        Remarks: "Withdrawal",
        QueueTimeOutURL: "https://elosystemv1.onrender.com/api/newpay/b2c/queue",
        ResultURL: "https://elosystemv1.onrender.com/api/newpay/b2c/result",
        Occasion: "Withdrawal",
      }, {
        headers: { Authorization: "Bearer " + accessToken }
      });
  
      return "Payment done succesfully";
    } catch (error) {
      console.log(error);
      console.log("❌ B2C request failed");
      return "❌ B2C request failed";
    }
  };
   */