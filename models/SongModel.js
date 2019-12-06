const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    bpm: Number,
    referenceUrls: [String],
    attachmentUrls: {
      type: [
        {
          title: String,
          url: String
        }
      ],
      default: []
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model("Song", songSchema);
