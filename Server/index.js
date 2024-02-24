const express = require("express");
const { Server } = require("socket.io");
const cors = require("cors");
const port = 3000;

const http = require("http");
const app = express();
const server = http.createServer(app);

app.use(cors());

const Mysql = require("mysql2");
const { error } = require("console");

const connection = Mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "code",
  database: "messages",
});

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

  socket.on("join_room", async (roomStatus) => {
    try {
      socket.join(roomStatus);
    } catch (error) {
      console.log("failed to capture room status");
    }
  });

  socket.on("send_message", (data) => {
    connection.connect(() => {
      const escape_socketID = connection.escape(socket.id);
      const escapeMessage = connection.escape(data.message);
      const insert_inTo_Msg = `INSERT INTO storeMessages(userMsg,user_socketID) VALUES (${escapeMessage}, ${escape_socketID})`;

      connection.query(insert_inTo_Msg, (error, result) => {
        if (error) return console.log("failed to log into database", error);
        console.log("recored added to StoredMessgaes");
      });
    });

    connection.connect((error) => {
      if (error) {
        console.log(error);
      } else {
        const storedMsg = "SELECT * FROM storeMessages";
        connection.query(storedMsg, (error, results) => {
          if (error) return console.error(error.message);

          results.map((data) => {
            // console.log(data.userMsg);
            socket.broadcast.emit("received_messages", {
              message: data.userMsg,
            });
          });
        });
      }
    });
  });
});

// Define a route to fetch messages
app.get("/messages", async (req, res) => {
  connection.connect(() => {
    const storedMessages = `SELECT * FROM storeMessages`;
    connection.query(storedMessages, (error, results) => {
      res.json({ messages: results });
    });
  });
});

server.listen(port, () => {
  console.log(`backend running on ${port}`);
});
