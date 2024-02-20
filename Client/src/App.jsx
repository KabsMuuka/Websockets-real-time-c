import { useEffect, useState } from "react";
import "./App.css";
import io, { connect } from "socket.io-client";
const socket = io.connect("http://localhost:3000");

function App() {
  const [userInput, setUserInput] = useState("");
  //passing a msg to from userInput to and variable
  const [message, setMessage] = useState([]);

  const SendMessage = () => {
    // console.log("button Clicked");
    if (userInput != "") {
      socket.emit("send_message", { message: userInput });
    } else {
      alert("Type a message");
    }
  };

  useEffect(() => {
    socket.on("received_messages", (data) => {
      setMessage([...message, data]); //It uses the spread operator [...message] to create a new array containing all the elements of the existing message state, and then appends the new data to the end of this array.
    });
    return () => {
      socket.off("received_message");
    };
  }, [message]);

  return (
    <>
      <h1>Websockets </h1>
      <input type="text" onChange={(e) => setUserInput(e.target.value)} />
      <button onClick={SendMessage}> Send</button>

      <h1>Message: </h1>
      <div>
        {message &&
          message.map((msg, index) => (
            // console.log(msg.message);
            <p key={index}> {msg.message}</p>
          ))}
      </div>
    </>
  );
}

export default App;
