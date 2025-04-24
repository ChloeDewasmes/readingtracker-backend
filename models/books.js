const mongoose = require("mongoose");

const bookSchema = mongoose.Schema({
  createdAt: Date,
  title: String,
  author: String,
  genre: String,
  totalPage: Number,
});

const Book = mongoose.model("books", bookSchema);

module.exports = Book;
