const PendingJob = require('./models/PendingJob');
const { b2cRequestHandler } = require("./controllers/mpesaController"); //get stk
const Delivery = require("./models/Delivery"); 

const https = require('https');


const processPendingJobs = async () => {
    try {
        const unprocessedJobs = await PendingJob.find({ processed: false }); // Get unprocessed jobs
        for (let job of unprocessedJobs) {
            const { callbackData } = job;
            const resultCode = callbackData.ResultCode;
            const checkoutId = callbackData.CheckoutRequestID;


            if (resultCode === 0) {
                const amountpaid = callbackData.CallbackMetadata.Item.find(item => item.Name.trim() === "Amount").Value;
                const MpesaReceiptNumber = callbackData.CallbackMetadata.Item.find(item => item.Name.trim() === "MpesaReceiptNumber").Value;
                const PhoneNumber = callbackData.CallbackMetadata.Item.find(item => item.Name.trim() === "PhoneNumber").Value;

                

                
                const delivery = await Delivery.findById({ CheckoutRequestID: checkoutId })
                  .populate("rider");
            
                if (!delivery) {
                  return res.status(404).json({ message: "Delivery not found in jobs" });
                }

                if (delivery) {
                    delivery.paymentStatus = "paid";
                    await delivery.save();

                    console.log(`Processed job for order ${checkoutId}`);
                } else {
                    console.error(`Order not found for CheckoutRequestID: ${checkoutId}`);
                }

            }

            job.processed = true; // Mark job as processed
            await job.save();
        }
    } catch (error) {
        console.error("Error processing pending jobs:", error);
    }
};



const keepServerActive = (url) => {
  const req = https.get(url, (res) => {
    console.log(`Pinged ${url} - Status: ${res.statusCode}`);
  });

  req.on('error', (err) => {
    console.error(`Error pinging ${url}:`, err.message);
  });
  req.end();
};

setInterval(() => keepServerActive('https://final-year-project-etga.onrender.com/api/auth/up'), 720000);


setInterval(processPendingJobs, 60000);
