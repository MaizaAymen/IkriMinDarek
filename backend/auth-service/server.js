const express = require("express");
const sequelize = require("./config");
const User = require("./models/userModel");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
 const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", 
  credentials: true }));

app.use("/api/auth", authRoutes);
sequelize.sync({ alter: true }).then(() => {
  console.log("✅ Models synced with DB");
  app.listen(4000, () => console.log("Auth service running on port 4000"));
});
