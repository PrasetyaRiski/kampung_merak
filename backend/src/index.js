import express from "express";
import cors from "cors";
import { getDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import eggsRoutes from "./routes/eggs.js";
import peafowlRoutes from "./routes/peafowl.js";
import salesRoutes from "./routes/sales.js";
import usersRoutes from "./routes/users.js";
import alertsRoutes from "./routes/alerts.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Inisialisasi database
getDb();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/eggs", eggsRoutes);
app.use("/api/peafowl", peafowlRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/alerts", alertsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
  console.log(`API endpoints tersedia di /api`);
});