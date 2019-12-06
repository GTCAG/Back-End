const express = require("express");
const Group = require("../models/GroupModel");
const router = express.Router();

/**
 * Retrieves all the groups
 */
router.get("/", (req, res) => {
  Group.find()
    .then(groups => {
      res.status(200).json(groups);
    })
    .catch(err => {
      console.log("Error retrieving groups: ", err);
      res.status(500).json({ error: "Could not get groups" });
    });
});

/**
 * Creates a group.
 * The shape of the request body needs to be
 * {
 *      groupName: (String),
 *      admin: (user_id)
 *
 * }
 */
router.post("/", (req, res) => {});

module.exports = router;
