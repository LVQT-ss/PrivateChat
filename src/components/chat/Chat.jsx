import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";

const Chat = () => {
  const [chat, setChat] = useState();
  const [isRoom, setIsRoom] = useState(false);
  const [roomDetails, setRoomDetails] = useState(null);
  const [roomMembers, setRoomMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, isRoomChat } =
    useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  // Determine if this is a room chat
  useEffect(() => {
    setIsRoom(isRoomChat || false);
  }, [isRoomChat]);

  // Load chat/room messages
  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(
      doc(db, isRoom ? "chatRooms" : "chats", chatId),
      (res) => {
        if (res.exists()) {
          setChat(res.data());

          // If this is a room, store room details
          if (isRoom) {
            setRoomDetails(res.data());
          }
        }
      }
    );

    return () => {
      unSub();
    };
  }, [chatId, isRoom]);

  // Load room members if this is a room chat
  useEffect(() => {
    if (!isRoom || !roomDetails || !roomDetails.members) return;

    const fetchRoomMembers = async () => {
      try {
        const membersPromises = roomDetails.members.map(async (memberId) => {
          const memberDoc = await getDoc(doc(db, "users", memberId));
          if (memberDoc.exists()) {
            return { id: memberId, ...memberDoc.data() };
          }
          return null;
        });

        const members = (await Promise.all(membersPromises)).filter(Boolean);
        setRoomMembers(members);
      } catch (error) {
        console.error("Error fetching room members:", error);
      }
    };

    fetchRoomMembers();
  }, [isRoom, roomDetails]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if (text === "") return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      const messageData = {
        senderId: currentUser.id,
        text,
        createdAt: new Date(),
        ...(imgUrl && { img: imgUrl }),
      };

      if (isRoom) {
        // Handle room message
        await updateDoc(doc(db, "chatRooms", chatId), {
          messages: arrayUnion(messageData),
          lastMessage: text,
          lastMessageAt: new Date(),
        });
      } else {
        // Handle direct message
        await updateDoc(doc(db, "chats", chatId), {
          messages: arrayUnion(messageData),
        });

        const userIDs = [currentUser.id, user.id];

        userIDs.forEach(async (id) => {
          const userChatsRef = doc(db, "userchats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data();

            const chatIndex = userChatsData.chats.findIndex(
              (c) => c.chatId === chatId
            );

            userChatsData.chats[chatIndex].lastMessage = text;
            userChatsData.chats[chatIndex].isSeen =
              id === currentUser.id ? true : false;
            userChatsData.chats[chatIndex].updatedAt = Date.now();

            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          }
        });
      }
    } catch (err) {
      console.log(err);
    }

    setImg({
      file: null,
      url: "",
    });

    setText("");
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img
            src={isRoom ? "./room.png" : user?.avatar || "./avatar.png"}
            alt=""
          />
          <div className="texts">
            <span>{isRoom ? roomDetails?.name : user?.username}</span>
            <p>{isRoom ? `${roomMembers.length} members` : "Direct message"}</p>
          </div>
        </div>
        <div className="icons">
          {!isRoom && (
            <>
              <img src="./phone.png" alt="" />
              <img src="./video.png" alt="" />
            </>
          )}
          <img src="./info.png" alt="" />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map((message, index) => (
          <div
            className={
              message.senderId === currentUser?.id ? "message own" : "message"
            }
            key={`${message.senderId}-${index}`}
          >
            {message.senderId !== currentUser?.id && (
              <img
                src={
                  isRoom
                    ? roomMembers.find((m) => m.id === message.senderId)
                        ?.avatar || "./avatar.png"
                    : user?.avatar || "./avatar.png"
                }
                alt=""
              />
            )}
            <div className="texts">
              {isRoom && message.senderId !== currentUser?.id && (
                <span className="senderName">
                  {roomMembers.find((m) => m.id === message.senderId)
                    ?.username || "User"}
                </span>
              )}
              {message.img && <img src={message.img} alt="" />}
              <p>{message.text}</p>
              {/* <span>{message}</span> */}
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder={
            isRoom
              ? "Type a message to room..."
              : isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!isRoom && (isCurrentUserBlocked || isReceiverBlocked)}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={!isRoom && (isCurrentUserBlocked || isReceiverBlocked)}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
