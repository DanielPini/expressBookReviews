const express = require("express");
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Validate input
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please enter both username and password" });
  }

  // Check if username already exists using isValid
  if (!isValid(username)) {
    return res.status(409).json({ message: "Username already exists" });
  }

  // Create a new user
  const newUser = {
    username: username,
    password: password,
  };

  users.push(newUser);

  return res
    .status(201)
    .json({ message: "User registered successfully", username: username });
});

// Get the book list available
public_users.get("/", async function (req, res) {
  try {
    if (!books || Object.keys(books).length === 0) {
      return res.status(404).json({ message: "No books available" });
    }

    const booksList = await new Promise((reseolve, reject) => {
      try {
        const formattedBooks = Object.entries(books).map(([isbn, book]) => ({
          isbn,
          ...book,
        }));
        reseolve(formattedBooks);
      } catch (error) {
        reject(new Error("Error formatting books data"));
      }

      return res.status(200).json({
        message: `Found ${booksList.length} books`,
        books: booksList,
      });
    });
  } catch (error) {
    console.error("Error fetching books", error.message);
    return res.status(500).json({
      message: "Internal server error while fetching books",
      error: error.messge,
    });
  }
});

// Get book details based on ISBN
public_users.get("/isbn/:isbn", async function (req, res) {
  try {
    // Input validation
    if (!req.params.isbn) {
      return res.status(400).json({ message: "Please enter a valid ISBN" });
    }

    const isbn = req.params.isbn;

    if (!books[isbn]) {
      return res.status(404).json({
        message: `Book with ISBN ${isbn} not found`,
      });
    }

    const book = await new Promise((resolve, reject) => {
      try {
        resolve(books[isbn]);
      } catch (error) {
        reject(new Error("Error searching for book by ISBN"));
      }
    });
    // Format and return the found book
    return res.status(200).json({
      message: `Book with ISBN ${isbn} found`,
      book: book,
    });
  } catch (error) {
    console.error("Error when fetching book details", error.message);
    return res.status(404).json({
      message: error.message,
    });
  }
});

// Get book details based on author
public_users.get("/author/:author", async function (req, res) {
  try {
    const author = req.params.author;
    if (!author) {
      return res.status(400).json({ message: "Please enter a valid author" });
    }

    const bookList = await new Promise((resolve, reject) => {
      try {
        const bookKeysList = Object.keys(books);
        let foundBooks = [];

        for (const isbn of bookKeysList) {
          const authoredBook = books[isbn];
          if (
            authoredBook.author.toLowerCase().includes(author.toLowerCase())
          ) {
            foundBooks.push({ isbn, ...authoredBook });
          }
        }
        if (foundBooks.length === 0) {
          reject(new Error(`No books found by author: ${author}`));
        }
        resolve(foundBooks);
      } catch (error) {
        reject(new Error(`Error searching for ${author}`));
      }
    });

    return res.status(200).json({
      message: `${bookList.length > 1 ? "Books" : "Book"} by ${author} found`,
      books: bookList,
    });
  } catch (error) {
    console.log(`Author search error:`, error.message);
    return res.status(404).json({ message: error.message });
  }
});

// Get all books based on title
public_users.get("/title/:title", async function (req, res) {
  try {
    const title = req.params.title;
    if (!title) {
      return res.status(400).send("Please enter a valid title");
    }
    const bookList = await new Promise((resolve, reject) => {
      try {
        const bookKeysList = Object.keys(books);
        let foundBooks = [];
        for (const isbn of bookKeysList) {
          const authoredBook = books[isbn];
          if (authoredBook.title.toLowerCase().includes(title.toLowerCase())) {
            foundBooks.push({ isbn, ...authoredBook });
          }
        }
        if (foundBooks.length === 0) {
          reject(new Error(`No books found with title ${title}`));
        }
        resolve(foundBooks);
      } catch (error) {
        console.error("Something went wrong", error.message);
        reject(new Error(`Error searching for ${title}`));
      }
    });
    return res.status(200).json({
      message: `${
        bookList.length > 1 ? "Books" : "Book"
      } with title ${title} found: `,
      books: bookList,
    });
  } catch (error) {
    console.error("Something went wrong", error.message);
    return res
      .status(404)
      .json({ message: "No books with title " + title + "found" });
  }
});

//  Get book review
public_users.get("/review/:isbn", function (req, res) {
  const isbn = req.params.isbn;

  // Input validation
  if (!isbn) {
    return res.status(400).json({
      message: "Please enter a valid isbn",
    });
  }

  // Check if book exists
  if (!books[isbn]) {
    return res.status(404).json({ message: `No book with ISBN ${isbn} found` });
  }

  // Get reviews and handle potential undefined
  const reviews = books[isbn].reviews || {};
  const numberOfReviews = Object.keys(reviews).length;

  return res.status(200).json({
    message: `${numberOfReviews} ${
      numberOfReviews === 1 ? "review" : "reviews"
    } found for ${books[isbn].title} with ISBN ${isbn}`,
    reviews: reviews,
  });
});

module.exports.general = public_users;
