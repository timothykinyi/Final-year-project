const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

dotenv.config();
connectDB();
require('./worker');
require('./workers/groupDeliveries');
const app = express();
const server = http.createServer(app);
const riderWalletRoutes = require("./routes/riderWalletRoutes");


// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // React frontend in dev
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/deliveries", require("./routes/deliveryRoutes"));
app.use("/api/shops", require("./routes/shopRoutes"));
app.use("/api/riders", require("./routes/riderRoutes"));
app.use("/api/share", require("./routes/shareRoutes"));
app.use("/api/utils", require("./routes/costRoutes"));
app.use("/api/rider", riderWalletRoutes);
app.use("/api/mesa", require("./routes/newmpesaRoutes"));
// Socket.IO setup

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // React frontend
    methods: ["GET", "POST"],
    credentials: true,
  },
});
//http://localhost:8080
//http://localhost:3000
io.on("connection", (socket) => {
  console.log("🔌 New socket connected:", socket.id);

  // Join delivery room
  socket.on("joinDelivery", ({ deliveryId }) => {
    if (!deliveryId) return;
    socket.join(`delivery_${deliveryId}`);
    console.log(`✅ Socket ${socket.id} joined delivery_${deliveryId}`);
  });

  // Leave delivery room
  socket.on("leaveDelivery", ({ deliveryId }) => {
    if (!deliveryId) return;
    socket.leave(`delivery_${deliveryId}`);
    console.log(`🚪 Socket ${socket.id} left delivery_${deliveryId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// Make io available to controllers via req.app.get("io")
app.set("io", io);

// Error handler (last middleware)
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack || err);
  res.status(500).json({
    message: "Internal Server Error",
    error: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
