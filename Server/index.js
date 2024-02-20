const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const port = 3000;

const http = require("http");
const app = express();
const server = http.createServer(app);

app.use(cors());

const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017/messages";
const client = new MongoClient(uri);

// const allMsgs = await storedMessages.find().toArray();

//This binds socket.IO server to Undering http server,
//thus allowing them to communicate effectively.
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const database = client.db("messages");
const storedMessages = database.collection("storedMessages");

io.on("connection", (socket) => {
  console.log(`someone connected ${socket.id}`);

  socket.on("send_message", async (data) => {
    try {
      await storedMessages.insertOne({ userMsg: data.message });
    } catch (err) {
      console.error("Error occurred while inserting message to database", err);
    }

    try {
      const storedMsg = await storedMessages.find().toArray();

      storedMsg.map((data) => {
        socket.broadcast.emit("received_messages", { message: data.userMsg });
        // console.log(data.userMsg);
      });
    } catch (error) {
      console.log(error);
    }
    //socket.broadcast.emit("received_message", data);
  });
});
server.listen(port, () => {
  console.log(`backend running on ${port}`);
});
