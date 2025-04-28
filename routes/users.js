var express = require("express");
var router = express.Router();

const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const uniqid = require("uniqid");
const { checkAndGrantBadges } = require("../controllers/checkAndGrantBadges");

/* ACCOUNT CREATION */
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "MISSING_OR_EMPTY_FIELD" });
    return;
  }

  const createdAt = new Date();

  // Check if the user has not already been registered
  User.findOne({
    // Check if the email is already used
    $or: [{ email: { $regex: new RegExp(req.body.email, "i") } }],
  }).then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        createdAt,
        email: req.body.email,
        password: hash,
        token: uid2(32),
        points: 0,
      });

      newUser.save().then((newUser) => {
        res.json({ result: true, token: newUser.token });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: "USER_ALREADY_EXISTS" });
    }
  });
});

/* LOGIN */
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "MISSING_OR_EMPTY_FIELD" });
    return;
  }

  User.findOne({ email: { $regex: new RegExp(req.body.email, "i") } }).then(
    (data) => {
      if (data === null) {
        res.json({ result: false, error: "USER_NOT_FOUND" });
        return;
      } else {
        if (data && bcrypt.compareSync(req.body.password, data.password)) {
          res.json({
            result: true,
            token: data.token,
            userPreferences: data.userPreferences,
          });
        } else {
          res.json({ result: false, error: "WRONG_PASSWORD" });
        }
      }
    }
  );
});

/* DELETE ACCOUNT */
router.delete("/deleteAccount/:token", (req, res) => {
  User.findOne({ token: req.params.token })
    .then((user) => {
      if (!user) {
        res.json({ result: false, error: "USER_NOT_FOUND" });
        return Promise.reject("NoUserFound"); // <- bloquer proprement ici
      }
      return User.deleteOne({ _id: user._id });
    })
    .then(() => {
      res.json({ result: true, message: "Account successfully deleted" });
    })
    .catch((error) => {
      if (error !== "NoUserFound") {
        // <- on ignore l'erreur qu'on a volontairement lancée
        console.error(error);
        res.json({
          result: false,
          error: "An error occurred while deleting account",
        });
      }
    });
});

/* GET USER INFORMATIONS */
router.get("/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (!user) return res.json({ result: false, error: "USER_NOT_FOUND" });

    res.json({
      result: true,
      data: {
        points: user.points,
        badges: user.badges,
        followedBooks: user.followedBooks,
        readBooks: user.readBooks,
      },
    });
  });
});

/* GET USER EMAIL */
router.get("/email/:token", (req, res) => {
  User.findOne({ token: req.params.token }).then((user) => {
    if (!user) return res.json({ result: false, error: "USER_NOT_FOUND" });

    res.json({
      result: true,
      email: user.email,
    });
  });
});

/* UPDATE USER EMAIL */
router.put("/email/:token", (req, res) => {
  const { newEmail } = req.body;

  if (!newEmail) {
    return res.json({ result: false, error: "NEW_EMAIL_IS_REQUIRED" });
  }

  User.findOne({ token: req.params.token })
    .then((user) => {
      if (!user) {
        return res.json({ result: false, error: "USER_NOT_FOUND" });
      }

      // Check if the email is already used
      return User.findOne({
        email: { $regex: new RegExp(`^${newEmail}$`, "i") },
        _id: { $ne: user._id }, // different user
      }).then((existingUser) => {
        if (existingUser) {
          return res.json({ result: false, error: "EMAIL_ALREADY_IN_USE" });
        }

        // Update email
        return User.findByIdAndUpdate(
          user._id,
          { email: newEmail },
          { new: true }
        ).then((updatedUser) => {
          res.json({ result: true, email: updatedUser.email });
        });
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({ result: false, error: "An error occurred" });
    });
});

/* UPDATE USER PASSWORD */
router.put("/password/:token", (req, res) => {
  if (!checkBody(req.body, ["oldPassword", "newPassword", "confirmPassword"])) {
    return res.json({ result: false, error: "MISSING_OR_EMPTY_FIELD" });
  }

  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Check if new passwords are matching
  if (newPassword !== confirmPassword) {
    return res.json({
      result: false,
      error: "NEW_PASSWORDS_DO_NOT_MATCH",
    });
  }

  if (!newPassword) {
    return res.json({ result: false, error: "NEW_PASSWORD_IS_REQUIRED" });
  }

  User.findOne({ token: req.params.token })
    .then((user) => {
      if (!user) {
        return res.json({ result: false, error: "USER_NOT_FOUND" });
      }

      // Check if old password is correct
      const isOldPasswordValid = bcrypt.compareSync(oldPassword, user.password);
      if (!isOldPasswordValid) {
        return res.json({ result: false, error: "OLD_PASSWORD_INCORRECT" });
      }

      // If old password is correct, hash the new one
      const hash = bcrypt.hashSync(newPassword, 10);

      // Update password in database
      return User.findByIdAndUpdate(
        user._id,
        { password: hash },
        { new: true }
      ).then((updatedUser) => {
        res.json({ result: true, message: "Password successfully updated" });
      });
    })
    .catch((error) => {
      console.error(error);
      res.json({
        result: false,
        error: "An error occurred while updating the password",
      });
    });
});

/* UPDATE PAGES READ FOR A FOLLOWED BOOK */
router.put("/updatePagesRead/:token/:bookId", (req, res) => {
  const { updatedPagesRead, totalPages } = req.body;

  if (updatedPagesRead === undefined) {
    return res.json({ result: false, error: "Missing updated pages read" });
  }

  User.findOne({ token: req.params.token })
    .then((user) => {
      if (!user) {
        return res.json({ result: false, error: "USER_NOT_FOUND" });
      }

      // Find book in array followedBooks
      const bookToUpdate = user.followedBooks.find(
        (book) => book.bookId.toString() === req.params.bookId
      );

      if (!bookToUpdate) {
        return res.json({
          result: false,
          error: "BOOK_NOT_FOUND_IN_FOLLOWED",
        });
      }

      // WHEN BOOK IS FINISHED :
      if (updatedPagesRead == totalPages) {
        // Remove from followed books and add to read book
        user.followedBooks = user.followedBooks.filter(
          (book) => !book.bookId.equals(req.params.bookId)
        );
        user.readBooks.push({
          bookId: req.params.bookId,
          finishedAt: new Date(),
        });

        // Add points to user according to number of pages
        if (totalPages < 150) {
          user.points += 10;
        } else if (totalPages <= 300) {
          user.points += 20;
        } else {
          user.points += 30;
        }

        // Attribute a badge if requirements are meet
        return checkAndGrantBadges(user).then(() => {
          return user.save().then(() => {
            res.json({
              result: true,
              message: "Progression updated successfully",
            });
          });
        });
      } else {
        // Book is not finished, update number of read pages
        bookToUpdate.pagesRead = updatedPagesRead;

        return user.save().then(() => {
          res.json({
            result: true,
            message: "Progression updated successfully",
          });
        });
      }
    })
    .catch((error) => {
      console.error(error);
      res.json({
        result: false,
        error: "An error occurred while updating progression",
      });
    });
});

/* MARK AS UNREAD */
router.put("/undoRead/:token/:bookId", (req, res) => {
  const { bookId, token } = req.params;

  User.findOne({ token: token })
    .then((user) => {
      if (!user) {
        return res.json({ result: false, error: "USER_NOT_FOUND" });
      }

      const bookToUpdateIndex = user.readBooks.findIndex(
        (book) => book.bookId.toString() === bookId
      );

      if (bookToUpdateIndex === -1) {
        return res.json({
          result: false,
          error: "BOOK_NOT_FOUND_IN_READ",
        });
      }

      // Remove the book from readBooks and move it back to followedBooks
      const removedBook = user.readBooks.splice(bookToUpdateIndex, 1)[0];

      user.followedBooks.push({
        bookId: removedBook.bookId,
        pagesRead: 0,
      });

      user
        .save()
        .then(() => {
          res.json({
            result: true,
            message: "Book successfully moved back to followed books.",
          });
        })
        .catch((err) => {
          console.log("Save error:", err);
          res.json({
            result: false,
            error: "ERROR_SAVING_USER",
          });
        });
    })
    .catch((err) => {
      console.log("Find user error:", err);
      res.json({
        result: false,
        error: "ERROR_FINDING_USER",
      });
    });
});

module.exports = router;
