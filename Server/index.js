const express = require("express");
const app = express();
const { Server } = require("socket.io");
const port = 3001;
const con = require("./db/db");

const cors = require("cors");
const http = require("http");
const server = http.createServer(app);

app.use(cors());

//This binds socket.IO server to Undering http server,
//thus allowing them to communicate effectively.
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:27017"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`someone connected ${socket.id}`);

  socket.on("join_room", (roomStatus) => {
    socket.join(roomStatus);
  });

  socket.on("send_message", (data) => {
    const escapeMessage = con.escape(data.message);
    const escape_roomNuber = con.escape(data.room);
    const insert_inTo_Msg = `INSERT INTO storeMessages(userMsg,room) VALUES (${escapeMessage}, ${escape_roomNuber})`;

    con.query(insert_inTo_Msg, (error) => {
      if (error) return console.log("failed to log into database", error);
    });

    const storedMsg = "SELECT * FROM storeMessages";
    con.query(storedMsg, (error, results) => {
      if (error) return console.error(error.message);

      results.map((msg) => {
        //if room exist only send msgs of that room
        if (msg.room) {
          //data has a property room
          io.to(data.room).emit("received_messages", {
            message: msg.userMsg,
          });
        } else {
          socket.broadcast.emit("received_messages", {
            message: msg.userMsg,
          });
        }
      });
    });
  });
});

// Define a route to fetch messages
app.get("/messages", (req, res) => {
  const sql = `SELECT * FROM storeMessages`;
  con.query(sql, (error, results) => {
    if (error) throw error;
    res.json({ messages: results });
    // res.status(200).json(results);
  });
});

server.listen(port, () => {
  console.log(`backend running on ${port}`);
});
