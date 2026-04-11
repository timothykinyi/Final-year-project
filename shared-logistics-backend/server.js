const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const Shop = require("./models/Shop");
const Rider = require("./models/Rider");

dotenv.config();
connectDB();
require('./worker');
require('./workers/groupDeliveries');
const app = express();
const server = http.createServer(app);
const riderWalletRoutes = require("./routes/riderWalletRoutes");
const adminRoutes = require("./routes/adminRoutes");


// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "https://twendecontroll.web.app", "http://localhost:3001", "https://twendedeliver.web.app"], // React frontend in dev
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
// Routes
app.use("/api/deliveries", require("./routes/deliveryRoutes"));
app.use("/api/shops", require("./routes/shopRoutes"));
app.use("/api/riders", require("./routes/riderRoutes"));
app.use("/api/share", require("./routes/shareRoutes"));
app.use("/api/utils", require("./routes/costRoutes"));
app.use("/api/rider", riderWalletRoutes);
app.use("/api/mesa", require("./routes/newmpesaRoutes"));
app.use("/admin", adminRoutes);
app.use("/api/auth", require("./routes/authRoutes"));
// Socket.IO setup


const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://twendecontroll.web.app/", "https://twendedeliver.web.app", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 🔐 AUTH MIDDLEWARE
io.use(async (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;

    if (!cookies) {
      return next(new Error("No cookies"));
    }

    const parsed = cookie.parse(cookies);
    const token = parsed.token;

    if (!token) {
      return next(new Error("No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 Try shop
    let user = await Shop.findById(decoded.id).select("-password");

    if (user) {
      socket.user = { ...user.toObject(), role: "shop" };
      return next();
    }

    // 🔍 Try rider
    user = await Rider.findById(decoded.id).select("-password");

    if (user) {
      socket.user = { ...user.toObject(), role: "rider" };
      return next();
    }

    return next(new Error("User not found"));

  } catch (err) {
    return next(new Error("Unauthorized"));
  }
});


// 🚀 CONNECTION
io.on("connection", (socket) => {
  console.log("🔌 New socket connected:", socket.id);
  console.log("👤 User:", socket.user?.id, socket.user?.role);

  // ✅ Join delivery room (with basic protection)
  socket.on("joinDelivery", ({ deliveryId }) => {
    if (!deliveryId) return;

    // Optional: add ownership check later
    socket.join(`delivery_${deliveryId}`);

    console.log(
      `✅ ${socket.user.role} ${socket.user.id} joined delivery_${deliveryId}`
    );
  });

  // 🚪 Leave delivery
  socket.on("leaveDelivery", ({ deliveryId }) => {
    if (!deliveryId) return;

    socket.leave(`delivery_${deliveryId}`);

    console.log(
      `🚪 ${socket.user.role} ${socket.user.id} left delivery_${deliveryId}`
    );
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
