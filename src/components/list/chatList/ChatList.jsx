import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import CreateChatRoom from "./createRoom/CreateChatRoom";
import { useUserStore } from "../../../lib/userStore";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
  query,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [createRoomMode, setCreateRoomMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  // Fetch direct chats
  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        if (res.exists() && res.data().chats) {
          const items = res.data().chats;

          const promises = items.map(async (item) => {
            const userDocRef = doc(db, "users", item.receiverId);
            const userDocSnap = await getDoc(userDocRef);

            const user = userDocSnap.data();

            return { ...item, user, type: "direct" };
          });

          const chatData = await Promise.all(promises);
          setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        } else {
          setChats([]);
        }
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  // Fetch chat rooms
  useEffect(() => {
    const roomsPath = `userchats/${currentUser.id}/rooms`;

    const unSub = onSnapshot(collection(db, roomsPath), async (snapshot) => {
      const roomsPromises = snapshot.docs.map(async (roomDoc) => {
        const roomData = roomDoc.data();
        const roomId = roomData.roomId;

        // Get the room details
        const roomRef = doc(db, "chatRooms", roomId);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
          const roomDetails = roomSnap.data();
          return {
            ...roomData,
            ...roomDetails,
            chatId: roomId,
            type: "room",
            user: {
              username: roomDetails.name,
              avatar: "./room.png", // Use a room icon
              id: roomId,
            },
            lastMessage: roomDetails.lastMessage || "",
            updatedAt: roomDetails.lastMessageAt?.toMillis() || Date.now(),
          };
        }
        return null;
      });

      const rooms = (await Promise.all(roomsPromises)).filter(Boolean);
      setChatRooms(rooms);
    });

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    if (chat.type === "direct") {
      const userChats = chats.map((item) => {
        const { user, ...rest } = item;
        return rest;
      });

      const chatIndex = userChats.findIndex(
        (item) => item.chatId === chat.chatId
      );

      if (chatIndex !== -1) {
        userChats[chatIndex].isSeen = true;

        const userChatsRef = doc(db, "userchats", currentUser.id);

        try {
          await updateDoc(userChatsRef, {
            chats: userChats,
          });
          changeChat(chat.chatId, chat.user);
        } catch (err) {
          console.log(err);
        }
      }
    } else if (chat.type === "room") {
      // Handle room selection
      changeChat(chat.chatId, chat.user, true); // Added a third parameter to indicate it's a room
    }
  };

  // Function to close the AddUser component
  const handleCloseAddUser = () => {
    setAddMode(false);
  };

  // Function to close the CreateChatRoom component
  const handleCloseCreateRoom = () => {
    setCreateRoomMode(false);
  };

  // Combine direct chats and rooms for display
  const allChats = [...chats, ...chatRooms].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  const filteredChats = allChats.filter((c) =>
    c.user.username.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className="actionButtons">
          <img
            src="./room.png"
            alt="Create Room"
            className="add"
            onClick={() => setCreateRoomMode(true)}
            title="Create Chat Room"
          />
          <img
            src={addMode ? "./minus.png" : "./plus.png"}
            alt="Add User"
            className="add"
            onClick={() => setAddMode((prev) => !prev)}
            title="Add User"
          />
        </div>
      </div>
      {filteredChats.map((chat) => (
        <div
          className="item"
          key={`${chat.type}-${chat.chatId}`}
          onClick={() => handleSelect(chat)}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
          }}
        >
          <img
            src={
              chat.type === "room"
                ? "./room.png"
                : chat.user.blocked?.includes(currentUser.id)
                ? "./avatar.png"
                : chat.user.avatar || "./avatar.png"
            }
            alt=""
          />
          <div className="texts">
            <span>
              {chat.type === "room"
                ? chat.user.username
                : chat.user.blocked?.includes(currentUser.id)
                ? "User"
                : chat.user.username}
            </span>
            <p>
              {chat.lastMessage || (chat.type === "room" ? "Chat Room" : "")}
            </p>
          </div>
          {chat.type === "room" && (
            <div className="roomBadge">
              <span>Room</span>
            </div>
          )}
        </div>
      ))}

      {addMode && <AddUser onClose={handleCloseAddUser} />}
      {createRoomMode && <CreateChatRoom onClose={handleCloseCreateRoom} />}
    </div>
  );
};

export default ChatList;
