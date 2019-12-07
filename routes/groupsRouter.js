const express = require("express");
const Group = require("../models/GroupModel");
const User = require("../models/UserModel");
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
 * Get group by id
 */
router.get("/:id", validateGroupId, (req, res) => {
  res.status(200).json(req.group);
});

/**
 * Creates a group.
 * The shape of the request body needs to be
 *   {
 *      groupName: (String),
 *      creatorId: (user_id)
 *   }
 */
router.post("/", (req, res) => {
  const body = req.body;
  if (!body.groupName || !body.creatorId) {
    res
      .status(400)
      .json({ error: "groupName and creatorId fields are required." });
  } else {
    //Verify user ID exists.
    User.findById({ _id: req.body.creatorId })
      .then(user => {
        if (user) {
          //Verified user exists with that id, create new group now.
          const newGroup = new Group({
            name: body.groupName,
            admins: [body.creatorId],
            members: [{ role: "other", userId: body.creatorId }]
          });
          newGroup
            .save()
            .then(createdGroup => {
              user.groups.push(createdGroup._id);
              user
                .save()
                .then(updatedUser => {
                  res.status(201).json({ createdGroup, updatedUser });
                })
                .catch(error => {
                  console.log(
                    "Error updating user with group id when creating group",
                    err
                  );
                  res.status(500).json({
                    error:
                      "Error updating users groups with newly created group id"
                  });
                });
            })
            .catch(err => {
              console.log("Error making new group", err);
              res.status(500).json({ error: "Could not create new group." });
            });
        } else {
          res
            .status(404)
            .json({ error: "Could find user by that id (creatorId)" });
        }
      })
      .catch(err => {
        console.log("Error trying to verify user id", err);
        res.status(500).json({
          error:
            "There was an error trying to verify the user id of the creator (creatorId)"
        });
      });
  }
});

/**
 * Edit group by id
 */
router.put("/:id", validateGroupId, (req, res) => {
  Group.findByIdAndUpdate(
    { _id: req.params.id },
    { ...req.body },
    { new: true, useFindAndModify: false }
  )
    .then(updatedGroup => {
      res.status(200).json(updatedGroup);
    })
    .catch(err => {
      console.log("Error trying to update group by id");
      res.status(500).json({ error: "Could not update group." });
    });
});

/**
 *  Delete a group by the group id (_id in mongodb)
 *  Returns back the group that was deleted if successful.
 */
router.delete("/:id", validateGroupId, (req, res) => {
  Group.findByIdAndDelete(req.params.id)
    .then(group => {
      for (const member of group.members) {
        User.findById({ _id: member.userId })
          .then(userMember => {
            //Remove group id from user's groups array.
            userMember.groups.splice(userMember.groups.indexOf(group._id), 1);
            userMember.save();
          })
          .catch(err => {
            console.log("Error finding member", err);
          });
      }

      res.status(200).json(group);
    })
    .catch(err => {
      console.log("Error trying to remove group by id", err);
      res.status(500).json({ error: "Could not remove group" });
    });
});

function validateGroupId(req, res, next) {
  const groupId = req.params.id;
  Group.findById({ _id: groupId })
    .then(group => {
      if (group) {
        req.group = group;
        next();
      } else {
        res.status(404).json({ error: "Could not find group by that id" });
      }
    })
    .catch(err => {
      console.log("Error trying to verify group by id", err);
      res.status(500).json({ error: "Could not verify group id" });
    });
}

module.exports = router;
