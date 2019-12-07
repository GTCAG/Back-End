const express = require("express");
const Event = require("../models/EventModel");
const Group = require("../models/GroupModel");
const router = express.Router();

/**
 * Get all events
 */
router.get("/", (req, res) => {
  Event.find()
    .then(events => {
      res.status(200).json(events);
    })
    .catch(err => {
      console.log("error retrieving events", err);
      res.status(500).json({ error: "Could not get events" });
    });
});

/**
 * Get event by id
 */
router.get("/:id", verifyEventId, (req, res) => {
  res.status(200).json(req.event);
});

/**
 * Create a new event
 *  Example date in request body: "12-25-2019 1:00 PM"
 */
router.post("/", verifyGroupId, (req, res) => {
  const body = req.body;
  //verify body has an eventDate field
  if (!body.eventDate) {
    res.status(400).json({ error: "eventDate field is required" });
  } else {
    //Body is good to go, make new event now and try to save to db.

    const group = req.group;

    const newEvent = new Event({
      date: body.eventDate,
      songs: [],
      associatedGroup: group._id
    });
    newEvent
      .save()
      .then(createdEvent => {
        //Add the event to the group that made it.
        group.events.push(createdEvent._id);
        group
          .save()
          .then(updatedGroup => {
            res.status(201).json({ createdEvent, updatedGroup });
          })
          .catch(err => {
            console.log("Error updating group after creating new event", err);
            res.status(500).json({
              error: "Could not update group after creating new event",
              createdEvent
            });
          });
      })
      .catch(err => {
        console.log("Error creating a new event", err);
        res
          .status(500)
          .json({ message: "Could not create event", error: err.message });
      });
  }
});

/**
 * Delete event by event id
 */
router.delete("/:id", verifyEventId, (req, res) => {
  req.event
    .remove()
    .then(removedEvent => {
      const associatedGroupId = removedEvent.associatedGroup;
      Group.findById({ _id: associatedGroupId })
        .then(group => {
          if (group) {
            //Remove event from groups events array
            group.events.splice(group.events.indexOf(removedEvent._id), 1);
            group
              .save()
              .then(() => {
                res.status(200).json({ message: "event removed" });
              })
              .catch(err => {
                console.log("Error updating group when deleting event", err);
                res.status(500).json({
                  error:
                    "Could not update groups events array, although event was deleted"
                });
              });
          } else {
            res.status(500).json({
              error: "Event was removed but could not find associated group"
            });
          }
        })
        .catch(err => {
          console.log("Error finding group by id", err);
          res.status(500).json({
            error:
              "Removed event but there was an error trying to find associated group"
          });
        });
    })
    .catch(err => {
      console.log("Error removing event", err);
      res.status(500).json({ error: "Could not remove event" });
    });
});

/**
 * Edit event by id
 */
router.put("/:id", verifyEventId, (req, res) => {
  req.event
    .update(req.body)
    .then(updatedEvent => {
      res.status(200).json(updatedEvent);
    })
    .catch(err => {
      console.log("Error trying to update event", err);
      res.status(500).json({ error: "Could not update event" });
    });
});

function verifyEventId(req, res, next) {
  const id = req.params.id;
  Event.findById({ _id: id })
    .then(event => {
      if (event) {
        req.event = event;
        next();
      } else {
        res.status(404).json({ error: "Could not find event by that id" });
      }
    })
    .catch(err => {
      console.log("Error verifying event by id", err);
      res.status(500).json({ error: "Could not verify event by id" });
    });
}

function verifyGroupId(req, res, next) {
  if (!req.body.groupId) {
    res.status(400).json({ error: "groupId field is required" });
  } else {
    Group.findById({ _id: req.body.groupId })
      .then(group => {
        if (group) {
          req.group = group;
          next();
        } else {
          res.status(404).json({ error: "Could not find group by that id" });
        }
      })
      .catch(err => {
        console.log("Error verifying group by id", err);
        res
          .status(500)
          .json({ error: "Could not verify group by id or invalid ID" });
      });
  }
}

module.exports = router;
