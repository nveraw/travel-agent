import express from "express";
import cors from "cors";
import travelRouter from "./routes/travel";

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// All travel AI routes — replace with real API calls in the future
app.use("/api", travelRouter);

app.listen(PORT, () => {
  console.log(`🚀 Travel AI server running on http://localhost:${PORT}`);
});
