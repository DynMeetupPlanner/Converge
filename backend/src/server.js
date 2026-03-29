import express from "express";
import AuthRoutes from "./routes/AuthRoutes.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import PlaceRoutes from "./routes/PlaceRoutes.js";

dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());

connectDB();

app.use("/Auth", AuthRoutes);
app.use("/places", PlaceRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Converge API",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server has started and listening on port: ", PORT);
});
