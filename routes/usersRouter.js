const express = require("express");
const router = express.Router();
const User = require("../models/UserModel");

/**
 * Shows all users
 */
router.get("/", (req, res) => {
  User.find({}, "username firstName lastName _id", (err, users) => {
    if (err) {
      console.log("Error retrieving users:", err);
      res.status(500).json({ error: "Could not get users" });
    } else {
      res.status(200).json(users);
    }
  });
});

/**
 * Get user by id (_id from mongodb)
 */
router.get("/:id", validateUserId, (req, res) => {
  res.status(200).json(req.user);
});

/**
 * Creates a user,
 * body requires username, password, and firstName fields.
 * An optional lastName field and others could be added.
 */
router.post("/", (req, res) => {
  const body = req.body;
  if (!body.username || !body.password || !body.firstName) {
    res.status(400).json({
      error: "username, password, and firstName fields are required in the body"
    });
  } else {
    const user = new User({ ...body });
    user
      .save()
      .then(user => {
        res.status(201).json(user);
      })
      .catch(err => {
        console.log("Error creating user: ", err);
        res.status(500).json({ error: "Could not create user" });
      });
  }
});

/**
 * Delete a user by id (_id from mongodb)
 */
router.delete("/:id", validateUserId, (req, res) => {
  const id = req.params.id;
  User.findByIdAndDelete(id)
    .then(user => {
      res.status(200).json(user);
    })
    .catch(err => {
      console.log("Error deleting user: ", err);
      res.status(500).json({ error: "Could not delete user" });
    });
});

/**
 * Update user by id (_id from mongodb)
 */
router.put("/:id", validateUserId, (req, res) => {
  User.findByIdAndUpdate();
  User.findByIdAndUpdate(
    { _id: req.params.id },
    { ...req.body },
    { new: true, useFindAndModify: false },
    (err, newUser) => {
      if (err) {
        console.log("Error updating user", err);
        res.status(500).json({ error: "Could not update user" });
      } else {
        if (newUser) res.status(200).json(newUser);
        else res.status(404).json({ error: "Couldnt' find user" });
      }
    }
  );
});

//Middleware function to check if a user exists with specified id in req.params
function validateUserId(req, res, next) {
  User.findById(req.params.id, "username firstName lastName _id")
    .then(user => {
      if (user) {
        req.user = user;
        next();
      } else res.status(404).json({ error: "Could not find user by that id" });
    })
    .catch(err => {
      console.log("Error finding user by id", err);
      res.status(500).json({ error: "Error trying to find user by id" });
    });
}

module.exports = router;
