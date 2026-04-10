// controllers/deliveryCostController.js
const Delivery = require("../models/Delivery");
const Rider = require("../models/Rider");
const Shop = require("../models/Shop");

// helper for distance
function haversine(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const calculateDeliveryCost = async (req, res) => {
  try {
    const { deliveryId } = req.params;

    // fetch delivery, populate shop + rider
    const delivery = await Delivery.findById(deliveryId)
      .populate("shop")
      .populate("rider");

    if (!delivery) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    // === From & To ===
    const from = delivery.shop.location.coordinates; // [lng, lat]
    const to = delivery.customerLocation.coordinates; // [lng, lat]

    // === Vehicle fuel efficiency map ===
    const vehicleFuelMap = {
      boda: 35,   // km/L
      tuktuk: 25,
      car: 15,
      van: 10,
      truck: 5,
    };

    const rider = delivery.rider;
    const vehicleType = rider?.vehicleType || "boda";
    const fuelConsumption = vehicleFuelMap[vehicleType] || 30;


    // === Hardcoded values ===
    const fuelPricePerL = 100; // KES
    const markupPercent = 0;   // %
    const baseFee = 0;

    // === Distance & Costs ===
    const distance = haversine(from, to); // km
    const fuelCost = (distance / fuelConsumption) * fuelPricePerL;
    const cost =
      baseFee + fuelCost + (markupPercent / 100) * (baseFee + fuelCost);

    return res.json({
      deliveryId,
      from,
      to,
      distance: `${distance.toFixed(2)} km`,
      vehicleType,
      fuelConsumption: `${fuelConsumption} km/L`,
      fuelPricePerL,
      baseFee,
      markupPercent,
      fuelCost: fuelCost.toFixed(2),
      totalCost: cost.toFixed(0),
    });
  } catch (err) {
    console.error("❌ Error calculating delivery cost:", err);
    return res.status(500).json({ message: "Failed to calculate delivery cost" });
  }
};


async function calculateDeliveryCostin(fromCoords, toCoords, vehicleType) {
  try {
    const from = fromCoords;
    const to = toCoords;

    // Vehicle fuel efficiency map (km/L)
    const vehicleFuelMap = {
      boda: 35,
      tuktuk: 25,
      car: 15,
      van: 10,
      truck: 5,
    };

    const fuelConsumption = vehicleFuelMap[vehicleType] || 30;

    // Hardcoded values
    const fuelPricePerL = 180; // KES
    const markupPercent = 2; // %
    const baseFee = 0;

    // Distance in km
    const distance = haversine(from, to); 

    const fuelCost = (distance / fuelConsumption) * fuelPricePerL;
    const cost = baseFee + fuelCost + (markupPercent / 100) * (baseFee + fuelCost);

    return parseFloat(cost.toFixed(0));
  } catch (err) {
    console.error("❌ Error calculating delivery cost:", err);
    return NaN; // return NaN explicitly for invalid calculation
  }
}



module.exports = {
    calculateDeliveryCostin,
    calculateDeliveryCost
};