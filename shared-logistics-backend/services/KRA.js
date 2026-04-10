const { Buffer } = require('buffer');
require('dotenv').config();

const generateAuthToken = async () => {
    console.log("[2/3] Fetching access token from GavaConnect...");
    const BASE_URL = 'https://sbx.kra.go.ke';
    const consumerKey = process.env.KRA_CONSUMER_KEY;
    const consumerSecret = process.env.KRA_CONSUMER_SECRET;
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch(`${BASE_URL}/v1/token/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: { 'Authorization': `Basic ${credentials}` }
    });
    
    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Auth Failed (${tokenResponse.status}): ${errorText}`);
    }

    return tokenResponse.ok ? (await tokenResponse.json()).access_token : null;
};

async function checkPinById(idNumber) {
    const BASE_URL = 'https://sbx.kra.go.ke';


    try {
        console.log(`[1/3] Starting PIN check for ID: ${idNumber}...`);
        const access_token = await generateAuthToken();

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
        
        return result;

    } catch (error) {
        console.error("✖ GavaConnect Integration Error:", error.message);
        throw error;
    }
}

module.exports = { checkPinById };