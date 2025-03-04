require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const customer_routes = require("./router/auth_users.js").authenticated;
const genl_routes = require("./router/general.js").general;

const app = express();
app.use(express.json());

app.use(
  "/customer",
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

app.use("/customer/auth/*", function auth(req, res, next) {
  let user = req.params.username;
  // Check if session and authorization exist
  if (!req.session || !req.session.authorization) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Get the token from the session
  const token = req.session.authorization.accessToken;

  try {
    // Verify the token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // If verification successful, set user in request
    req.user = {
      username: req.session.authorization.username,
      data: verified.data,
    };

    return next();
  } catch (error) {
    // Handle token verification errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
});

const PORT = 5500;

app.use("/customer", customer_routes);

app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));
