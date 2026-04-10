// utils/assignVehicle.js
const assignVehicle = (totalWeight) => {
  if (totalWeight <= 10) return "boda";
  if (totalWeight <= 30) return "tuktuk";
  if (totalWeight <= 100) return "car";
  if (totalWeight <= 300) return "van";
  if (totalWeight <= 1000) return "truck";
  throw new Error("Weight exceeds max truck capacity");
};

module.exports = assignVehicle;
