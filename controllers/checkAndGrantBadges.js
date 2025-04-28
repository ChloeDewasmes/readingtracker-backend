const Book = require("../models/books");

async function checkAndGrantBadges(user) {
  const newBadges = [];

  // Badge for amount of book read
  if (user.readBooks.length === 1 && !user.badges.includes("reader_1")) {
    newBadges.push("reader_1");
  }
  if (user.readBooks.length === 5 && !user.badges.includes("reader_5")) {
    newBadges.push("reader_5");
  }
  if (user.readBooks.length === 20 && !user.badges.includes("reader_20")) {
    newBadges.push("reader_20");
  }

  // Badge for reading different genres
  const books = await Book.find({
    _id: { $in: user.readBooks.map((b) => b.bookId) },
  });
  const uniqueGenres = [...new Set(books.map((b) => b.genre))];

  if (uniqueGenres.length >= 3 && !user.badges.includes("genre_3")) {
    newBadges.push("genre_3");
  }
  if (uniqueGenres.length >= 5 && !user.badges.includes("genre_5")) {
    newBadges.push("genre_5");
  }

  // Badge for 5 books read in less than 2 weeks
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);

  const booksLastTwoWeeks = user.readBooks.filter(
    (book) => new Date(book.finishedAt) >= twoWeeksAgo
  );

  if (
    booksLastTwoWeeks.length >= 5 &&
    !user.badges.includes("5_books_2_weeks")
  ) {
    newBadges.push("5_books_2_weeks");
  }

  // Badge for book of 300 pages or more read
  const lastBook = books.find(
    (b) =>
      b._id.toString() ===
      user.readBooks[user.readBooks.length - 1].bookId.toString()
  );
  if (
    lastBook &&
    lastBook.totalPages > 300 &&
    !user.badges.includes("300_pages_book")
  ) {
    newBadges.push("300_pages_book");
  }

  // Badge for 10 books read in one month
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);

  const booksLastMonth = user.readBooks.filter(
    (book) => new Date(book.finishedAt) >= oneMonthAgo
  );

  if (booksLastMonth.length >= 10 && !user.badges.includes("10_books_month")) {
    newBadges.push("10_books_month");
  }

  // Badge for 30 books read in one year
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  const booksLastYear = user.readBooks.filter(
    (book) => new Date(book.finishedAt) >= oneYearAgo
  );

  if (booksLastYear.length >= 30 && !user.badges.includes("30_books_year")) {
    newBadges.push("30_books_year");
  }

  // Add new badges to user's info in database
  if (newBadges.length > 0) {
    user.badges.push(...newBadges);
    await user.save();
  }
}

module.exports = { checkAndGrantBadges };
