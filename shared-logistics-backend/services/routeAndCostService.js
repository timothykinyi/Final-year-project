// services/routeAndCostService.js
const axios = require("axios");

/**
 * Vehicle fuel economies (L / 100 km)
 */
const VEHICLE_FUEL_ECONOMY = {
  boda: 4.6,      // motorcycles
  tuktuk: 8.7,
  car: 22.8,      // passenger car
  van: 33.1,      // using matatu value for van (adjust if needed)
  truck: 40.0,    // conservative estimate; trucks vary a lot
};

/**
 * Get route distance (meters) using public OSRM routing endpoint
 * @param {[number, number]} from [lng, lat]
 * @param {[number, number]} to   [lng, lat]
 * @returns { number } distance in meters
 */
async function getRouteDistanceMetersOSRM(from, to) {
  if (!from || !to || !Array.isArray(from) || !Array.isArray(to)) {
    throw new Error("from and to must be [lng, lat]");
  }

  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;

  // public OSRM endpoint (no key, free). If you prefer, swap to ORS or self-hosted OSRM.
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false&alternatives=false&steps=false`;

  const res = await axios.get(url, { timeout: 10000 });
  if (!res.data || !res.data.routes || !res.data.routes.length) {
    throw new Error("No route returned by OSRM");
  }
  const distanceMeters = res.data.routes[0].distance; // meters
  return distanceMeters;
}

/**
 * Estimate costs for all vehicle types.
 *
 * @param {[number,number]} fromLngLat  [lng, lat]
 * @param {[number,number]} toLngLat    [lng, lat]
 * @param {Object} options
 *   - fuelPricePerL (KES), default 180
 *   - markupPercent (applied on fuel cost), default 30 (i.e., 30%)
 *   - baseFee (KES), default 50
 * @returns {Object}
 */
async function estimateDeliveryCosts(fromLngLat, toLngLat, options = {}) {
  const fuelPricePerL = typeof options.fuelPricePerL === "number" ? options.fuelPricePerL : 180; // KES
  const markupPercent = typeof options.markupPercent === "number" ? options.markupPercent : 30; // %
  const baseFee = typeof options.baseFee === "number" ? options.baseFee : 50; // KES

  const distanceMeters = await getRouteDistanceMetersOSRM(fromLngLat, toLngLat);
  const distanceKm = distanceMeters / 1000;

  // compute per vehicle
  const vehicles = {};
  for (const [vehicle, lPer100km] of Object.entries(VEHICLE_FUEL_ECONOMY)) {
    // liters used = (L/100km) * distance_km / 100
    const liters = (lPer100km * distanceKm) / 100;
    const fuelCostKES = liters * fuelPricePerL;

    // final suggested price = baseFee + fuelCost * (1 + markupPercent/100)
    const suggested = baseFee + fuelCostKES * (1 + markupPercent / 100);

    vehicles[vehicle] = {
      fuelEconomyLPer100km: lPer100km,
      distanceKm: Number(distanceKm.toFixed(3)),
      litersEstimated: Number(liters.toFixed(3)),
      fuelCostKES: Number(fuelCostKES.toFixed(2)),
      baseFeeKES: Number(baseFee),
      markupPercent: Number(markupPercent),
      suggestedPriceKES: Number(suggested.toFixed(2)),
    };
  }

  return {
    distanceMeters,
    distanceKm: Number(distanceKm.toFixed(3)),
    fuelPricePerL: Number(fuelPricePerL),
    baseFeeKES: Number(baseFee),
    markupPercent: Number(markupPercent),
    vehicles,
  };
}

module.exports = {
  estimateDeliveryCosts,
  getRouteDistanceMetersOSRM,
  VEHICLE_FUEL_ECONOMY,
};
