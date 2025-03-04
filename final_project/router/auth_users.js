const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [{ username: "testuser", password: "testpass" }];

const isValid = (username) => {
  let foundUser = users.find((user) => {
    return user.username === username;
  });
  if (foundUser) {
    return false;
  }
  return true;
};

const authenticatedUser = (username, password) => {
  let validusers = users.filter((user) => {
    return user.username === username && user.password === password;
  });
  if (validusers.length > 0) {
    return true;
  } else {
    return false;
  }
};

//only registered users can login
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Check if username or password is missing
  if (!username || !password) {
    return res.status(400).json({
      message: "Error logging in. Please enter both Username and password",
    });
  }

  const isAuthenticated = authenticatedUser(username, password);

  if (isAuthenticated) {
    // Generate JWT access token
    let accessToken = jwt.sign(
      {
        data: password,
      },
      process.env.JWT_SECRET,
      { expiresIn: "20m" }
    );

    req.session.authorization = {
      accessToken,
      username,
    };

    return res.status(200).json({
      message: `User ${username} successfully logged in`,
      token: accessToken,
    });
  }
  return res.status(401).json({ message: "Invalid username or password" });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.body.review;

  // Check if user is authenticated
  if (!req.session || !req.session.authorization) {
    return res.status(401).json({ message: "Please login first" });
  }

  // Validate input
  if (!isbn || !review) {
    return res
      .status(400)
      .json({ message: "Please enter both an ISBN and a review" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "ISBN not found" });
  }

  const username = req.session.authorization.username;

  // Initialize reviews object if it doesn't exist
  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  // Add the review with the username as key
  books[isbn].reviews[username] = review;

  return res
    .status(200)
    .json({ message: "Review added successfully", book: books[isbn].reviews });
});

// Delete book reviews
regd_users.delete("/auth/review/:isbn", (req, res) => {
  // Check if user is authenticated
  if (!req.session || !req.session.authorization) {
    return res.status(401).json({ message: "Please login first" });
  }

  // Save ISBN
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  // Validate input
  if (!isbn) {
    return res.status(400).json({ message: "Please enter an ISBN" });
  }

  // Check if book exists
  if (!books[isbn]) {
    return res.status(404).json({ message: `No book with ISBN ${isbn} found` });
  }

  // Check if reviews exist
  if (!books[isbn].reviews) {
    return res.status(404).json({ message: `No reviews found for this book` });
  }

  // Check if user has a review
  if (!books[isbn].reviews[username]) {
    return res
      .status(404)
      .json({ message: "You haven't reviewed this book yet" });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: "Review successfully deleted",
    reviews: books[isbn].reviews,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
