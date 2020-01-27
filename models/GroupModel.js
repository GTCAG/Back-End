const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    code: {
      type: String,
      required: true,
      unique: true
    },
    members: {
      type: [
        {
          role: String,
          user: {
            type: mongoose.Types.ObjectId,
            ref: "User"
          },
          versionKey: false
        }
      ],
      required: true,
      versionKey: false,
      default: []
    },
    admins: {
      type: [{ type: mongoose.Types.ObjectId, ref: "User" }],
      required: true,
      default: []
    },
    events: {
      type: [{ type: mongoose.Types.ObjectId, ref: "Event" }],
      default: [],
      required: true
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model("Group", groupSchema);
