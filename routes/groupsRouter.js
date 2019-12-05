const express = require("express");

const router = express.Router();

/**
 * Retrieves all the
 */
router.get("/", (req, res) => {});

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
