if (!process.env.NODE_ENV || process.env.NODE_ENV != "production")
  require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const usersRouter = require("./routes/usersRouter");
const eventsRouter = require("./routes/eventsRouter");
const groupsRouter = require("./routes/groupsRouter");
const songsRouter = require("./routes/songsRouter");
const authenticateToken = require("./routes/middleware/authenticateToken");

const server = express();
const port = process.env.PORT || 4000;

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

server.use("/charge", (req, res) => {});

server.get("/", (req, res) => {
  res.status(200).json({ message: "Test" });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
