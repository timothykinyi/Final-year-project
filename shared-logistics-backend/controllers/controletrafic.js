const Job = require("../models/Job");
const PendingJob = require('../models/PendingJob'); 


const { isUnderLimit } = require("../utils/requestRateLimiter");
const {stkPushHandler} = require("../controllers/mpesaController"); //get stk

exports.stkHandler = async (req, res) => {
  const { phone, amount, accountRef, key, code } = req.body;
  console.log("we weweweweweh ndio uyu mimi");
  try {
    const allowImmediate = await isUnderLimit();

    if (allowImmediate) {
      const result = await stkPushHandler( phone, amount, accountRef, code );
      return res.status(200).json({
        message: "STK Push sent immediately",
        result
      });
    } else {
      const job = new Job({
        type: "stkPush",
        data: { phone, amount, accountRef, code }
      });

      await job.save();

      return res.status(202).json({
        message: "High traffic — request queued",
        jobId: job._id
      });
    }
  } catch (err) {
    console.error("❌ Error in STK push:", err.message);
    res.status(500).json({ error: "Failed to handle request" });
  }
};

exports.stkPushCallbackHandler = async (req, res) => {
  console.log("wewe niko ndni");
  const json = JSON.stringify(req.body);
  const callbackData = req.body.Body.stkCallback;

  const checkoutRequestId = callbackData.CheckoutRequestID;
  if (!checkoutRequestId) {
      console.error("M-Pesa Callback missing CheckoutRequestID. Body:", JSON.stringify(req.body));
      // Respond 200 OK to Daraja to prevent unnecessary retries for malformed data
      return res.status(200).json({ ResultCode: 1, ResultDesc: "Missing CheckoutRequestID." });
  }

  try {
      await PendingJob.create({ callbackData, processed: false }); // Save unprocessed job
      console.log('Callback received and queued for processing.');
      res.status(200).json({ message: 'Callback received and queued for processing.' });
  } catch (error) {
      console.error("Failed to queue job:", error);
      res.status(500).json({ message: 'Error queuing callback for processing' });
  }
 
};