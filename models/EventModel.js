const mongoose = require("mongoose");

const eventModel = new mongoose.Schema({
  date: {
    type: Date,
    require: true
  },
  roles: {
    type: [
      {
        title: String,
        members: [mongoose.Types.ObjectId]
      }
    ],
    required: true,
    default: []
  },
  songs: {
    type: [mongoose.Types.ObjectId],
    default: []
  }
});

module.exports = mongoose.model("Event", eventModel);
