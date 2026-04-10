const { Buffer } = require('buffer');

const { checkPinById } = require('./services/KRA');
/* async function checkPinById(idNumber, consumerKey1, consumerSecret1) {
    const BASE_URL = 'https://sbx.kra.go.ke';
    const consumerKey = consumerKey1;
    const consumerSecret = consumerSecret1;

    try {
        console.log(`[1/3] Starting PIN check for ID: ${idNumber}...`);
        console.log("[2/3] Fetching access token from GavaConnect...");

        const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        const tokenResponse = await fetch(`${BASE_URL}/v1/token/generate?grant_type=client_credentials`, {
            method: 'GET',
            headers: { 'Authorization': `Basic ${credentials}` }
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            throw new Error(`Auth Failed (${tokenResponse.status}): ${errorText}`);
        }

        const { access_token } = await tokenResponse.json();

        // 2. Query PIN Checker
        console.log("[3/3] Querying KRA PIN database...");
        const endpoint = `${BASE_URL}/checker/v1/pin`; 

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${access_token}`
            },
            body: JSON.stringify({ 
                "TaxpayerType": "KE", 
                "TaxpayerID": idNumber.toString()
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(`KRA API Error: ${result.message || response.statusText}`);
        }
        
        console.log("✔ Process complete.");
        return result;

    } catch (error) {
        console.error("✖ GavaConnect Integration Error:", error.message);
        throw error;
    }
}
 */
// --- Execution ---
// Replace 'b' and 'f' with your actual Consumer Key and Secret


checkPinById('41789723')
    .then(output => {
        console.log("\n--- FINAL OUTPUT ---");
        
        const data = output.Data || output; 
        
        const { ResponseCode, TaxpayerPIN, TaxpayerName } = data;

        console.log("--- Parsed Results ---");
        console.log(`Status: ${ResponseCode}`);
        console.log(`PIN: ${TaxpayerPIN}`);
        console.log(`Name: ${TaxpayerName}`);
    })
    .catch(err => {
        console.error("Error:", err.message);
    });