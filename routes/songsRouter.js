const express = require("express");
const AWS = require("aws-sdk");
const Song = require("../models/SongModel");
const router = express.Router();

const allowedFileTypes = ["application/pdf", "text/plain", "audio/mpeg"];

const BUCKET_NAME = process.env.AWS_BUCKET;

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "us-west-1",
  signatureVersion: "v4",
});

const options = {
  signatureVersion: "v4",
  region: "us-west-1",
  endpoint: new AWS.Endpoint(`http://s3-us-west-1.amazonaws.com`),
  useAccelerateEndpoint: false,
};

const client = new AWS.S3(options);

/**
 * Get all songs
 */
router.get("/", (req, res) => {
  Song.find()
    .then((songs) => {
      res.status(200).json(songs);
    })
    .catch((err) => {
      console.log("Error retrieving songs: ", err);
      res.status(500).json({ error: "Could not retrieve songs" });
    });
});

/**
 * Get song by ID
 */
router.get("/:id", verifySongId, (req, res) => {
  res.status(200).json(req.song);
});

/**
 * Create new song
 * Example request body:
 *
 *  {
 *      "title": "I want it that way", (required)
 *      "bpm": 73, (opt.)
 *      "referenceUrls": ["https://www.youtube.com/watch?v=4fndeDfaWCg"],(opt.)
 *      "attachmentUrls: [ {title: "I want it that way chords", url: "aws s3 link here"} ]" (opt.)
 *  }
 */
router.post("/", (req, res) => {
  const body = req.body;
  if (!body.title) {
    res.status(400).json({ error: "title field is required" });
  } else {
    const newSong = new Song(body);
    newSong
      .save()
      .then((createdSong) => {
        res.status(201).json(createdSong);
      })
      .catch((err) => {
        console.log("Error saving song:", err);
        res.status(500).json({ error: "Could not save song" });
      });
  }
});

/**
 * Edit song by id
 */
router.put("/:id", verifySongId, (req, res) => {
  req.song
    .update(req.body)
    .then((updatedSong) => {
      res.status(200).json({ updatedRecords: updatedSong.nModified });
    })
    .catch((err) => {
      console.log("Error trying to update song:", err);
      res.status(500).json({ error: "Could not update song" });
    });
});

router.put("/:id/addurl", verifySongId, async (req, res) => {
  const { url } = req.body;
  if (url) {
    req.song.referenceUrls.push(url);
    await req.song.save();
    res.status(200).json({ message: "Added url" });
  } else {
    res
      .status(401)
      .json({ message: "URL is a required field, yet it is empty" });
  }
});

router.delete("/:id/removeurl", verifySongId, async (req, res) => {
  const { url } = req.body;
  if (url) {
    const filteredArr = req.song.referenceUrls.filter(
      (refUrl) => refUrl != url
    );
    req.song.referenceUrls = filteredArr;
    await req.song.save();
    res.status(200).json({ message: "Removed url (if it was in the array)" });
  } else {
    res
      .status(401)
      .json({ message: "URL is a required field, yet it is empty" });
  }
});
/**
 * Delete song by id
 */
router.delete("/:id", verifySongId, (req, res) => {
  req.song
    .remove()
    .then((removedSong) => {
      res.status(200).json({ removedSong });
    })
    .catch((err) => {
      console.log("Error removing song", err);
      res.status(500).json({ error: "Could not remove song" });
    });
});

router.post(
  "/:id/attachment-upload-signature",
  verifySongId,
  async (req, res) => {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      res
        .status(401)
        .json({ message: "fileName and fileType field is required" });
      return;
    }

    if (!allowedFileTypes.includes(fileType)) {
      res.status(401).json({ message: "That file type is not supported" });
      return;
    }
    const songKey = encodeURIComponent(req.song._id) + "/";
    const fileKey = songKey + fileName;
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      Expires: 30 * 60, // 30 minutes
    };

    const signedURL = await client.getSignedUrlPromise("putObject", params);

    return res.status(200).json({ signedURL });
  }
);

router.get("/:id/attachment-list", verifySongId, async (req, res) => {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: `${req.song._id}/`,
  };

  try {
    const data = await new Promise((resolve, reject) => {
      client.listObjectsV2(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    const fileNames = [];
    for (fileData of data.Contents) {
      // Remove the abnormal song id folder string from the file name
      // By removing the initial Prefix
      const fileName = fileData.Key.replace(data.Prefix, "");
      fileNames.push(fileName);
    }
    res.status(200).json({ attachments: fileNames });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "There was an error listing the objects from aws" });
  }
});

router.get("/:id/attachment-signature", verifySongId, async (req, res) => {
  const { fileName } = req.body;

  if (!fileName) {
    res.status(401).json({ message: "fileName is a required field" });
    return;
  }

  const fileKey = `${req.song._id}/${fileName}`;
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Expires: 30 * 60, // 30 minutes
  };

  try {
    const signedURL = await client.getSignedUrlPromise("getObject", params);
    res.status(200).json({ signedURL });
  } catch (err) {
    res
      .status(500)
      .json({ message: "There was an error trying to get the signed url" });
    console.error("Error: ", err);
  }
});

function verifySongId(req, res, next) {
  const id = req.params.id;
  Song.findById({ _id: id })
    .then((song) => {
      if (song) {
        req.song = song;
        next();
      } else {
        res.status(404).json({ error: "Could not find song with that id" });
      }
    })
    .catch((err) => {
      console.log("Error trying to verify song by id", err);
      res.status(500).json({ error: "Could not verify song by id" });
    });
}

module.exports = router;
