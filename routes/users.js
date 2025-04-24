var express = require("express");
var router = express.Router();

const User = require("../models/users");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");
const uniqid = require("uniqid");

/* ACCOUNT CREATION */
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
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
      res.json({ result: false, error: "User already exists" });
    }
  });
});

/* CONNEXION */
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email: { $regex: new RegExp(req.body.email, "i") } }).then(
    (data) => {
      if (data === null) {
        res.json({ result: false, error: "User not found" });
        return;
      } else {
        if (data && bcrypt.compareSync(req.body.password, data.password)) {
          res.json({
            result: true,
            token: data.token,
            userPreferences: data.userPreferences,
          });
        } else {
          res.json({ result: false, error: "Wrong password" });
        }
      }
    }
  );
});

module.exports = router;
