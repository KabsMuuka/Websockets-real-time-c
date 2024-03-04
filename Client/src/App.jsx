import { useEffect, useState } from "react";
import "./App.css";
import io, { connect } from "socket.io-client";

const socket = io.connect("http://localhost:3000");

function App() {
  const [userInput, setUserInput] = useState("");
  //user can join specific room
  const [room, setRoom] = useState("");
  //passing a msg to from userInput to and variable
  const [message, setMessage] = useState([]);
  //seting and storing userID
  // const [userID, setUserID] = useState("");

  // const joinRoom = () => {
  //   socket.emit("join_room", room);
  //   // console.log(room);
  // };

  const SendMessage = () => {
    socket.on("received_messages", (socketID) => {
      console.log(socketID);
    });
    if (userInput != "" || room != "") {
      socket.emit("send_message", { message: userInput });

      setUserInput(" "); //clear userInput
    } else {
      alert("Type a message");
    }
  };

  useEffect(() => {
    socket.on("received_messages", (data) => {
      setMessage([...message, data]); //It uses the spread operator [...message] to create a new array containing all the elements of the existing message state, and then appends the new data to the end of this array.
      console.log(data);
    });
    return () => {
      socket.off("received_message");
    };
  }, [message]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("http://localhost:3000/messages");
        const data = await response.json();

        const messageContents = data.messages //data.messages is an array of messages;
          .map((msg) => msg.userMsg)
          .join("\n \n");
        setMessage([messageContents]);
      } catch (error) {
        console.log("Failed to Fetch msgs from the database", error);
      }
    }
    fetchData(); // Initiate data fetching on component mount
  }, [message]); //Empty dependency array to run only once

  return (
    <>
      {/* {userID &&
        userID.messages.map((user_id, index) => {
          return <ChatRoom key={index} storedID={user_id.user_socketID} />;
        })} */}

      {/* <input
          placeholder="Join Room"
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={joinRoom}> Join </button> */}

      <input type="text" onChange={(e) => setUserInput(e.target.value)} />
      <button onClick={SendMessage}> Send</button>

      <h1>Message: </h1>
      <div className="message_container">
        {message.map((msg, index) => (
          <pre key={index}>{msg}</pre>
        ))}
      </div>
    </>
  );
}

export default App;
