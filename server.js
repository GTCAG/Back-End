if (!process.env.NODE_ENV || process.env.NODE_ENV != "production")
  require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const expressGraphQL = require("express-graphql");

const usersRouter = require("./routes/usersRouter");
const groupsRouter = require("./routes/groupsRouter");

//GraphQL Stuff
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLList
} = require("graphql");
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

const GroupType = new GraphQLObjectType({
  name: "Group",
  description: "This represents a group of members for events/planning",
  fields: () => ({
    id: { type: GraphQLNonNull(GraphQLInt) },
    name: { type: GraphQLNonNull(GraphQLString) }
  })
});

const RootQueryType = new GraphQLObjectType({
  name: "Query",
  description: "Root Query",
  fields: () => ({
    groups: {
      type: new GraphQLList(GroupType),
      description: "List of groups",
      resolve: () => [
        { name: "Group 1", id: 2 },
        { name: "Group 2", id: 2 }
      ]
    }
  })
});
const schema = new GraphQLSchema({
  query: RootQueryType
});

server.use(express.json());

server.use("/users", usersRouter);
server.use("/groups", groupsRouter);

server.use(
  "/graphql",
  expressGraphQL({
    schema: schema,
    graphiql: true
  })
);

server.get("/", (req, res) => {
  res.status(200).json({ message: "Test" });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
