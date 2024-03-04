import { useEffect, useState } from "react";
import "./App.css";
import io, { connect } from "socket.io-client";

const socket = io.connect("http://localhost:3001");

function App() {
  const [userInput, setUserInput] = useState("");
  //user can join specific room
  const [room, setRoom] = useState("");
  //passing a msg to from userInput to and variable
  const [message, setMessage] = useState([]);

  const joinRoom = () => {
    socket.emit("join_room", room);
  };

  const SendMessage = () => {
    socket.emit("send_message", { message: userInput, room });
  };

  useEffect(() => {
    socket.on("received_messages", (data) => {
      setMessage([...message, data]); //It uses the spread operator [...message] to create a new array containing all the elements of the existing message state, and then appends the new data to the end of this array.
    });
    return () => {
      socket.off("received_message");
    };
  }, [message]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("http://localhost:3001/messages");
        const data = await response.json();
        // console.log("data", data);

        /* messagesFilteredByRoom check if msg.room is equal to room user has entered.
        messagesFilteredByRoom contains messages that specific room*/

        const messagesFilteredByRoom = data.messages.filter(
          (msg) => msg.room.toString() === room
        );
        const desiredMessags = messagesFilteredByRoom
          .map((msgs) => msgs.userMsg)
          .join("\n \n");
        // console.log(desiredMessags);
        setMessage([desiredMessags]);
      } catch (error) {
        console.log("Failed to Fetch msgs from the database", error);
      }
    }
    fetchData(); // Initiate data fetching on component mount
  }, [room, message]);

  return (
    <>
      <form action="">
        <div>
          <input
            placeholder="Join Room"
            onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinRoom}> Join </button>
        </div>

        <div>
          <input
            type="text"
            placeholder="Type a message"
            onChange={(e) => setUserInput(e.target.value)}
          />
          <button onClick={SendMessage}> Send</button>
        </div>
      </form>

      <h1>Message: </h1>
      <div className="message_container">
        <pre> {message} </pre>
      </div>
    </>
  );
}

export default App;
