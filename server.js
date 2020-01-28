if (!process.env.NODE_ENV || process.env.NODE_ENV != "production")
  require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const axios = require("axios");

const usersRouter = require("./routes/usersRouter");
const eventsRouter = require("./routes/eventsRouter");
const groupsRouter = require("./routes/groupsRouter");
const songsRouter = require("./routes/songsRouter");
const authenticateToken = require("./routes/middleware/authenticateToken");

const server = express();
const port = process.env.PORT || 4000;

const channelId = "UCNaKPci4jHkzFyo2hYwlVRQ";
// const channelId = "UC7tdoGx0eQfRJm9Qj6GCs0A"; //Test for live truth, using nourish channel id. (Always live)
const livestreamURI = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&type=video&eventType=live&key=${process.env.YOUTUBE_API_KEY}`;

/**
 * Connect to Mongoose using the DATABASE_URL environment variable.
 */
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", err => console.error(err));
db.once("open", () => console.log("Connected to Database"));

server.use(express.json());
server.use(cors());
server.use("/users", usersRouter);
server.use("/groups", authenticateToken, groupsRouter);
server.use("/events", authenticateToken, eventsRouter);
server.use("/songs", authenticateToken, songsRouter);

server.get("/livestream", (req, res) => {
  axios
    .get(livestreamURI)
    .then(response => {
      const items = response.data.items;
      if (items && items.length > 0) res.status(200).json({ live: true });
      else res.status(200).json({ live: false });
    })
    .catch(err => {
      console.log("Error checking livestream: ", err);
      res
        .status(500)
        .json({ message: "There was an error checking livestream" });
    });
});

server.post("/charge", async (req, res) => {
  console.log("Req body: ", req.body);
  try {
    let { status } = await stripe.charges.create({
      amount: req.body.amount * 100, //Amount to send to stripe is in pennies.
      currency: "usd",
      description: "Church donation",
      source: req.body.id
    });

    res.json({ status });
  } catch (err) {
    console.log(err);
    res.status(500).end();
  }
});

server.get("/", (req, res) => {
  res.status(200).json({ message: "Test" });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
