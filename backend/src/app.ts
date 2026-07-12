import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// Health Check
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Odoo Backend is running 🚀"
    });
});

export default app;