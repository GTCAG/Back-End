const mongoose = require("mongoose");

const eventModel = new mongoose.Schema(
  {
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
      type: [{ type: mongoose.Types.ObjectId, ref: "Song" }],
      default: []
    },
    associatedGroup: {
      type: mongoose.Types.ObjectId,
      required: true
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model("Event", eventModel);
