// services/costCalculator.js
const axios = require("axios");

// Fuel economy values (liters per 100 km)
const fuelConsumption = {
  boda: 4.6,      // Motorcycles
  tuktuk: 8.7,    // Tuktuks
  car: 22.8,      // Passenger cars
  van: 33.1,      // Matatus/minibuses
  truck: 40,      // Approximate (varies with load)
};

// Average fuel price in KES per liter (update based on real values in Kenya)
const fuelPrice = 180;

// === Function to get distance using ORS Directions API ===
async function getDistanceORS(start, end) {
  try {
    const url = "https://api.openrouteservice.org/v2/directions/driving-car";
    const response = await axios.post(
      url,
      {
        coordinates: [
          [start.lng, start.lat], // ORS expects [longitude, latitude]
          [end.lng, end.lat],
        ],
      },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const meters = response.data.routes[0].summary.distance;
    const distanceKm = meters / 1000;
    return distanceKm;
  } catch (error) {
    console.error("ORS distance error:", error.response?.data || error.message);
    throw new Error("Failed to calculate distance using ORS");
  }
}

// === Function to calculate cost ===
async function calculateDeliveryCost(riderVehicleType, shopLocation, customerLocation) {
  const distanceKm = await getDistanceORS(
    { lat: shopLocation.coordinates[1], lng: shopLocation.coordinates[0] },
    { lat: customerLocation.coordinates[1], lng: customerLocation.coordinates[0] }
  );

  // Calculate fuel consumption for rider’s vehicle
  const consumptionPerKm = fuelConsumption[riderVehicleType] / 100; // L per km
  const fuelUsed = distanceKm * consumptionPerKm;
  const fuelCost = fuelUsed * fuelPrice;

  // Add markup/profit margin (e.g., 30%)
  const markup = 0.3 * fuelCost;
  const finalCost = fuelCost + markup;

  return {
    distanceKm: distanceKm.toFixed(2),
    fuelCost: fuelCost.toFixed(2),
    finalCost: finalCost.toFixed(2),
    vehicleType: riderVehicleType,
  };
}

module.exports = { calculateDeliveryCost };
