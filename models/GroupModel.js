const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
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
    type: [
      {
        userId: mongoose.Types.ObjectId
      }
    ],
    required: true,
    default: []
  }
});

module.exports = mongoose.model("Group", groupSchema);
