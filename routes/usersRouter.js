const express = require("express");
const router = express.Router();
const User = require("../models/UserModel");
const bcrypt = require("bcrypt");

/**
 * Shows all users
 */
router.get("/", (req, res) => {
  User.find({}, "email firstName lastName _id", (err, users) => {
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
 * Logs the user in.
 * Request body example:
 *  {
 *    "email": "john",
 *    "password": "doe"
 *  }
 */
router.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).json({ error: "email and password fields are required" });
  } else {
    //Retrieve hash stored in db.
    User.find({ email: req.body.email })
      .then(user => {
        if (user.length > 0) {
          //User exists, compare passwords.
          const foundUser = user[0];
          bcrypt
            .compare(req.body.password, foundUser.password)
            .then(result => {
              if (result) {
                res.status(200).json({ message: "Logged in! Sort of..." });
              } else {
                res.status(401).json({ error: "Incorrect password" });
              }
            })
            .catch(err => {
              console.log("Error trying to compare password", err);
              res.status(500).json({
                error: "There was an error trying to verify the password"
              });
            });
        } else {
          res
            .status(404)
            .json({ error: "user with that email does not exist" });
        }
      })
      .catch(() => {
        res.status(500).json({ error: "Error trying to find user by email" });
      });
  }
});

/**
 * Creates a user,
 * body requires email, password, and firstName fields.
 * An optional lastName field and others could be added.
 */
router.post("/register", (req, res) => {
  const body = req.body;
  if (!body.email || !body.password || !body.firstName) {
    res.status(400).json({
      error: "email, password, and firstName fields are required in the body"
    });
  } else {
    //Hash password
    bcrypt
      .hash(body.password, 10)
      .then(hash => {
        body.password = hash;
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
      })
      .catch(err => {
        console.log("Error hashing password: ", err);
        res.status(500).json({ error: "Could not hash password" });
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
  User.findById(req.params.id, "email firstName lastName _id groups")
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
