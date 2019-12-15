const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    members: {
      type: [
        {
          role: String,
          userId: mongoose.Types.ObjectId
        }
      ],
      required: true,
      default: []
    },
    admins: {
      type: [mongoose.Types.ObjectId],
      required: true,
      default: []
    },
    events: {
      type: [mongoose.Types.ObjectId],
      default: [],
      required: true
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model("Group", groupSchema);
