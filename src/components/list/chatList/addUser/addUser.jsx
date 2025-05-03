import "./addUser.css";
import { db } from "../../../../lib/firebase";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = ({ onClose }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");

  const { currentUser } = useUserStore();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const userChatsSnap = await getDocs(collection(db, "userchats"));
        const addedChatIds =
          userChatsSnap.docs
            .find((doc) => doc.id === currentUser.id)
            ?.data()
            ?.chats?.map((chat) => chat.receiverId) || [];

        const users = usersSnapshot.docs
          .map((doc) => ({ ...doc.data(), id: doc.id }))
          .filter(
            (user) =>
              user.id !== currentUser.id && !addedChatIds.includes(user.id)
          );

        setAllUsers(users);
        setFilteredUsers(users);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUsers();
  }, [currentUser.id]);

  const handleAdd = async (user) => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });

      // Remove the user from the UI list after adding
      setFilteredUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchInput(value);
    setFilteredUsers(
      allUsers.filter((u) => u.username.toLowerCase().includes(value))
    );
  };

  return (
    <div className="addUser">
      <div className="addUserHeader">
        <h3>Add New User</h3>
        <button className="closeButton" onClick={onClose}>
          ✕
        </button>
      </div>
      <input
        type="text"
        placeholder="Search users..."
        value={searchInput}
        onChange={handleSearchChange}
      />
      <div className="userList">
        {filteredUsers.map((user) => (
          <div className="user" key={user.id}>
            <div className="detail">
              <img src={user.avatar || "./avatar.png"} alt="" />
              <span>{user.username}</span>
            </div>
            <button onClick={() => handleAdd(user)}>Add</button>
          </div>
        ))}
        {filteredUsers.length === 0 && <p>No users found.</p>}
      </div>
    </div>
  );
};

export default AddUser;
