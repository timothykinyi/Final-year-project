const Delivery = require("../models/Delivery");


// @desc    Create delivery request
// @route   POST /api/deliveries
// @access  Private (shop only)
exports.createDelivery = async (req, res) => {
  try {
    const { customerName, customerPhone, customerAddress, customerLocation, deliveryFee } = req.body;

    const delivery = await Delivery.create({
      shop: req.shop._id,
      customerName,
      customerPhone,
      customerAddress,
      customerLocation,
      deliveryweight: deliveryFee,
    });

    res.status(201).json(delivery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all deliveries for logged-in shop
// @route   GET /api/deliveries
// @access  Private (shop only)
exports.getDeliveriesByShop = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ shop: req.shop._id }).sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Filter deliveries by status/payment
// @route   GET /api/deliveries/filter?status=pending&paymentStatus=unpaid
// @access  Private (shop only)
exports.filterDeliveries = async (req, res) => {
  try {
    const { status, paymentStatus } = req.query;

    const query = { shop: req.shop._id };
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const deliveries = await Delivery.find(query).sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Cancel a delivery if still pending
// @route   PATCH /api/deliveries/:id/cancel
// @access  Private (shop only)
exports.cancelDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ _id: req.params.id, shop: req.shop._id });

    if (!delivery) return res.status(404).json({ message: "Delivery not found" });
    if (delivery.status !== "un_grouped") {
      return res.status(400).json({ message: "Only un grouped deliveries can be cancelled" });
    }

    delivery.status = "cancelled";
    await delivery.save();

    res.json({ message: "Delivery cancelled successfully", delivery });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



