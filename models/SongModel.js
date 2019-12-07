const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    bpm: { type: Number, default: 0 },
    referenceUrls: { type: [String], default: [] },
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
