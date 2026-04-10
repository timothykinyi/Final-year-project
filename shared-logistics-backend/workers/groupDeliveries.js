const Delivery = require("../models/Delivery");
const DeliveryGroup = require("../models/DeliveryGroup");
const assignVehicle = require("../utils/assignVehicle");
const haversine = require("haversine-distance");
const { calculateDeliveryCostin } = require("../controllers/costController");

const MIN_GROUP_SIZE = 3; // always 3+
const MAX_PICKUP_DIST = 1000; // meters
const MAX_DELIVERY_DIST = 1000; // meters

const groupDeliveries = async () => {
  try {
    // fetch ungrouped deliveries
    const deliveries = await Delivery.find({ status: "un_grouped" })
      .populate("shop")
      .populate("rider");

    if (!deliveries.length) return console.log("No deliveries to group.");

    const visited = new Set();
    const pending = []; // leftover deliveries

    const groups = [];

    for (let i = 0; i < deliveries.length; i++) {
      if (visited.has(deliveries[i]._id.toString())) continue;

      const group = [deliveries[i]];
      visited.add(deliveries[i]._id.toString());

      const baseShop = deliveries[i].shop.location.coordinates;
      const baseCust = deliveries[i].customerLocation.coordinates;

      // try to find nearby deliveries
      for (let j = i + 1; j < deliveries.length; j++) {
        if (visited.has(deliveries[j]._id.toString())) continue;

        const shopLoc = deliveries[j].shop.location.coordinates;
        const custLoc = deliveries[j].customerLocation.coordinates;

        const pickupDist = haversine(
          { lat: baseShop[1], lng: baseShop[0] },
          { lat: shopLoc[1], lng: shopLoc[0] }
        );

        const deliveryDist = haversine(
          { lat: baseCust[1], lng: baseCust[0] },
          { lat: custLoc[1], lng: custLoc[0] }
        );

        if (pickupDist <= MAX_PICKUP_DIST && deliveryDist <= MAX_DELIVERY_DIST) {
          group.push(deliveries[j]);
          visited.add(deliveries[j]._id.toString());
        }
      }

      // if group < MIN_GROUP_SIZE, put them in pending pool
      if (group.length < MIN_GROUP_SIZE) {
        pending.push(...group);
        continue;
      }

      // valid group -> assign vehicle and calculate costs
      const totalWeight = group.reduce((acc, d) => acc + d.deliveryweight, 0);
      const vehicleType = assignVehicle(totalWeight);

      const furthestPickup = group.reduce(
        (furthest, d) => {
          const dist = haversine({ lat: baseShop[1], lng: baseShop[0] }, { lat: d.shop.location.coordinates[1], lng: d.shop.location.coordinates[0] });
          return dist > furthest.dist ? { dist, coords: d.shop.location.coordinates } : furthest;
        },
        { dist: 0, coords: baseShop }
      ).coords;

      const furthestDelivery = group.reduce(
        (furthest, d) => {
          const dist = haversine({ lat: baseCust[1], lng: baseCust[0] }, { lat: d.customerLocation.coordinates[1], lng: d.customerLocation.coordinates[0] });
          return dist > furthest.dist ? { dist, coords: d.customerLocation.coordinates } : furthest;
        },
        { dist: 0, coords: baseCust }
      ).coords;

      const totalCost = await calculateDeliveryCostin(furthestPickup, furthestDelivery, vehicleType);

      // divide cost proportionally
      const totalWeightInGroup = group.reduce((acc, d) => acc + d.deliveryweight, 0);
      const totalDistanceInGroup = group.reduce(
        (acc, d) => acc + haversine(d.shop.location.coordinates, d.customerLocation.coordinates),
        0
      );

      for (const d of group) {
        const deliveryDist = haversine(d.shop.location.coordinates, d.customerLocation.coordinates);
        const weightFactor = d.deliveryweight / totalWeightInGroup;
        const distFactor = deliveryDist / totalDistanceInGroup;
        const individualCost = totalCost * 0.5 * weightFactor + totalCost * 0.5 * distFactor;

        if (!isNaN(individualCost)) {
          d.deliveryFee = parseFloat(individualCost.toFixed(0));
          d.status = "pending"; // ready to be dispatched
          await d.save();
        } else {
          console.warn(`⚠️ Skipping delivery ${d._id} due to invalid cost calculation`);
        }
      }

      // save group
      const groupDoc = new DeliveryGroup({
        deliveries: group.map(d => d._id),
        vehicleType,
        totalWeight,
        totalCost,
        pickupLocation: { type: "Point", coordinates: furthestPickup },
        deliveryLocation: { type: "Point", coordinates: furthestDelivery },
      });

      await groupDoc.save();
      groups.push(groupDoc);
    }

    // leave pending deliveries as un_grouped for next run
    if (pending.length) {
      console.log(`⏳ ${pending.length} deliveries left ungrouped, waiting for more arrivals.`);
    }

    console.log("✅ Grouping completed:", groups.length, "groups formed.");
    return groups;
  } catch (err) {
    console.error("❌ Error grouping deliveries:", err);
  }
};

setInterval(groupDeliveries, 60000);