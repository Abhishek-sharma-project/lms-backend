import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./database/db.js";
import userRoute from "./routes/user.route.js";

dotenv.config({});
// call database connection
connectDB();
const app = express();

const PORT = process.env.PORT || 3000;

// default middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

//apis
app.use("/api/v1/user", userRoute);

app.get("/", (req, res) => {
  res.send("working");
});

app.listen(PORT, () => {
  console.log(`server listen on port ${PORT}`);
});
