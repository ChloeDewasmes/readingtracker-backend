var express = require("express");
var router = express.Router();

const User = require("../models/users");
const Book = require("../models/books");
const { checkBody } = require("../modules/checkBody");

/* ADD A BOOK */
router.post("/", async (req, res) => {
  if (
    !checkBody(req.body, [
      "title",
      "author",
      "genre",
      "totalPages",
      "pagesRead",
    ])
  ) {
    res.json({ result: false, error: "MISSING_OR_EMPTY_FIELD" });
    return;
  }

  const { title, author, genre, totalPages, pagesRead, token } = req.body;
  const createdAt = new Date();

  // Check if the book has not already been registered
  try {
    let book = await Book.findOne({
      title: { $regex: title, $options: "i" },
      author: { $regex: author, $options: "i" },
      genre,
      totalPages,
    });

    // If it doesn't exit --> create new book
    if (!book) {
      book = await new Book({
        createdAt,
        title,
        author,
        genre,
        totalPages,
      }).save();
    }

    // Find the user
    const user = await User.findOne({ token });

    if (!user) {
      return res.json({ result: false, error: "USER_NOT_FOUND" });
    }

    // Check if the user already has this book in his library
    const existingEntryIndex = user.followedBooks.findIndex(
      (followedBook) => followedBook.bookId.toString() === book._id.toString()
    );

    if (existingEntryIndex !== -1) {
      // Book does already exist in the user library => update read pages
      user.followedBooks[existingEntryIndex].pagesRead = pagesRead;
    } else {
      // Book doesn't exist  => add it
      user.followedBooks.push({ bookId: book._id, pagesRead });
    }

    await user.save();

    res.json({ result: true, book: book.title });
  } catch (error) {
    console.error(error);
    res.json({ result: false, error: "An error occurred" });
  }
});

/* GET BOOK INFO FOR USER */
router.get("/followedBook/:bookId", (req, res) => {
  Book.findById(req.params.bookId)
    .then((book) => {
      if (!book) return res.json({ result: false, error: "BOOK_NOT_FOUND" });
      console.log("heyyy", book);

      res.json({
        result: true,
        title: book.title,
        totalPages: book.totalPages,
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ result: false, error: "An error occurred" });
    });
});

module.exports = router;
