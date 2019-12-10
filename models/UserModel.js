const mongoose = require("mongoose");

const userModel = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      default: ""
    },
    groups: {
      type: [mongoose.Types.ObjectId],
      default: []
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model("User", userModel);
