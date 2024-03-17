const express = require("express");
const app = express();
const { Server } = require("socket.io");
const port = 3001;
const con = require("./db/db");

const cors = require("cors");
const http = require("http");
const server = http.createServer(app);

app.use(cors());

//ecrypting data from the user
const { scrypt, randomFill, createCipheriv } = require("node:crypto");
const { buffer } = require("stream/consumers");
const { createDecipheriv } = require("crypto");
const e = require("express");
const { error } = require("console");
//decrypting data

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

    //ENCRYPTING DATA.
    //message we have
    const algorithm = "aes-256-cbc";
    const password = "password";

    //aes-256-ccm requires a 32 bit length and a random 12 bit for it to securly encrypt data
    const iv = Buffer.alloc(16);
    scrypt(password, "salt", 32, (err, key) => {
      // console.log("from encryption", key);
      randomFill(iv, (err) => {
        if (err) throw err;
        const cipher = createCipheriv(algorithm, key, iv); //authTagLength  ensures data integrity along with encryption. enhances security by making it more difficult to tamper with the data or forge the tag.
        const encryptedMessage =
          cipher.update(escapeMessage, "utf8", "hex") + cipher.final("hex");

        //escape encryptedMessages before storing in the database
        const newMessage = con.escape(encryptedMessage);
        //convert it to hex strings
        const ivHex = iv.toString("hex");
        const escape_iv = con.escape(ivHex);

        //insert encrypted message into the database
        const insert_inTo_Msg = `INSERT INTO storeMessages(userMsg,room, iv) 
        VALUES
         (${newMessage},
           ${escape_roomNuber},
          ${escape_iv})`;

        con.query(insert_inTo_Msg, (error) => {
          if (error) return console.log("failed to log into database", error);
        });
      });
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
app.get("/messages", async (req, res) => {
  const sql = `SELECT * FROM storeMessages`;
  const messages = await new Promise((resolve, reject) => {
    con.query(sql, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    }); //inside .then it can't
  }); //outside .then msgs is accessible.

  // Use Promise.all to wait for all Promises in decryptingMessages to resolve:
  const decryptingMessages = await Promise.all(
    messages.map(async (msgs) => {
      const { userMsg: encryptedMessage, iv } = msgs;

      // Derive the secure key for decryption
      const password = "password";
      const algorithm = "aes-256-cbc";
      // Convert the IV from hex string to a Buffer
      const iv_buffer = Buffer.from(iv, "hex");

      return new Promise((resolve, reject) => {
        scrypt(password, "salt", 32, (err, key) => {
          if (err) reject(err);
          const decipher = createDecipheriv(algorithm, key, iv_buffer);

          try {
            const decrypted =
              decipher.update(encryptedMessage, "hex", "utf8") +
              decipher.final("utf8");
            resolve(decrypted); //resolve the promise with decrypted inside the scrypt callback, and make sure you properly await the promise within map
          } catch (error) {
            console.error("Decryption error for message ID", error);
            return reject(error);
          }
        });
      });
    })
  );

  // console.log(decryptingMessages);
  //inside .then it can't
  const sql_room_extract = `SELECT * FROM storeMessages`;
  con.query(sql_room_extract, (error, results) => {
    if (error) throw error;
    results.map((msg) => {
      res.send({ messages: decryptingMessages , msg.room });
    });
  });
});

server.listen(port, () => {
  console.log(`backend running on ${port}`);
  // const iv = Buffer.alloc(12);
  // randomFill(iv, (err) => {
  //   if (err) throw err;
  //   const stored = iv;
  //   //converting back
  //   const iv_buffer = Buffer.from(iv, "hex");
  //   console.log("afterCov", iv_buffer);
  //   console.log("randomized iv", stored);
  // });

  // scrypt(password, "salt", 32, (err, key) => console.log("key", key));
});
