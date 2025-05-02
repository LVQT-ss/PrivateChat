import React, { useEffect, useState, useRef } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";

const Chat = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleEmoji = (e) => {
    setText((prevText) => prevText + e.emoji);
    setOpen(false);
  };

  const handleSend = () => {
    if (text.trim()) {
      console.log("Sending:", text); // Replace with actual message logic
      setText("");
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src="./avatar.png" alt="User avatar" />
          <div className="texts">
            <span>Jane Doe</span>
            <p>Lorem ipsum dolor, sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone" />
          <img src="./video.png" alt="Video call" />
          <img src="./info.png" alt="Info" />
        </div>
      </div>

      <div className="center">
        <div className="message">
          <img src="./avatar.png" alt="User avatar" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Error
              reiciendis repudiandae aspernatur ab architecto.
            </p>
            <span>1 min ago</span>
          </div>
        </div>

        <div className="message">
          <img src="./avatar.png" alt="User avatar" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Error
              reiciendis repudiandae aspernatur ab architecto.
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message">
          <img src="./avatar.png" alt="User avatar" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Error
              reiciendis repudiandae aspernatur ab architecto.
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message">
          <img src="./avatar.png" alt="User avatar" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Error
              reiciendis repudiandae aspernatur ab architecto.
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message">
          <img src="./avatar.png" alt="User avatar" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Error
              reiciendis repudiandae aspernatur ab architecto.
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message">
          <img src="./avatar.png" alt="User avatar" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Error
              reiciendis repudiandae aspernatur ab architecto.
            </p>
            <span>1 min ago</span>
          </div>
        </div>
        <div className="message">
          <img src="./avatar.png" alt="User avatar" />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Error
              reiciendis repudiandae aspernatur ab architecto.
            </p>
            <span>1 min ago</span>
          </div>
        </div>

        <div className="message own">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1z3WO2y5h7YkHljxIsvwuOxP21OE_8tnedA&s"
            alt="Own avatar"
          />
          <div className="texts">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Error
              reiciendis repudiandae aspernatur ab architecto.
            </p>
            <span>1 min ago</span>
          </div>
        </div>

        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <img src="./img.png" alt="Image" />
          <img src="./camera.png" alt="Camera" />
          <img src="./mic.png" alt="Mic" />
        </div>

        <input
          placeholder="Type a message"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="emoji">
          <img
            src="./emoji.png"
            alt="Emoji"
            onClick={() => setOpen((prev) => !prev)}
          />
          {open && (
            <div className="picker">
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>

        <button className="sendButton" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
