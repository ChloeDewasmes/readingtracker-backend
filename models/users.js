const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  createdAt: Date,
  email: String,
  password: String,
  token: String,
  followedBooks: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: "books" },
      pagesRead: Number,
    },
  ],
  readBooks: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: "books" },
      finishedAt: Date,
    },
  ],
  badges: [String],
  points: Number,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
