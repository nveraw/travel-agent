import express from "express";
import cors from "cors";
import path from "path";
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

app.use(express.static(path.join(__dirname, "../../client/dist")));

// catch-all for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});
