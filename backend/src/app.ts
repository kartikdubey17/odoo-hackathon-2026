import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import driverRoutes from "./routes/driver.routes";

const app = express();

// Middleware

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
// Health Check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Odoo Backend is running 🚀"
    });
});

export default app;