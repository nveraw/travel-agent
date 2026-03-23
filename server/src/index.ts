import cors from "cors";
import express from "express";
import dataRouter from "./routes/data.js";
import travelRouter from "./routes/travel.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://travel-agent-nveraw.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

app.use(express.json());
app.use("/api", travelRouter);
app.use("/internal", dataRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 server running on http://localhost:${PORT}`);
  });
}

export default app;
