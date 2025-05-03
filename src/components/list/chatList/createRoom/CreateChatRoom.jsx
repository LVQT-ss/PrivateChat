import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useUserStore } from "../../../../lib/userStore";
import "./createChatRoom.css";

const CreateChatRoom = ({ onClose }) => {
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { currentUser } = useUserStore();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));

        const users = usersSnapshot.docs
          .map((doc) => ({ ...doc.data(), id: doc.id }))
          .filter((user) => user.id !== currentUser.id);

        setAllUsers(users);
        setFilteredUsers(users);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUsers();
  }, [currentUser.id]);

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchInput(value);
    setFilteredUsers(
      allUsers.filter((u) => u.username.toLowerCase().includes(value))
    );
  };

  const handleUserSelect = (user) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (roomName.trim() === "") return;

    setIsLoading(true);

    try {
      // Create chat room document
      const roomRef = await addDoc(collection(db, "chatRooms"), {
        name: roomName.trim(),
        isPrivate: isPrivate,
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
        members: [currentUser.id, ...selectedUsers.map((user) => user.id)],
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
      });

      // Add room to creator's chat list
      const creatorChatRef = doc(
        db,
        "userchats",
        currentUser.id,
        "rooms",
        roomRef.id
      );
      await setDoc(creatorChatRef, {
        roomId: roomRef.id,
        joinedAt: serverTimestamp(),
        isAdmin: true,
      });

      // Add room to selected users' chat lists
      for (const user of selectedUsers) {
        const userChatRef = doc(db, "userchats", user.id, "rooms", roomRef.id);
        await setDoc(userChatRef, {
          roomId: roomRef.id,
          joinedAt: serverTimestamp(),
          isAdmin: false,
        });
      }

      setRoomName("");
      setSelectedUsers([]);
      setIsPrivate(false);
      onClose();
    } catch (error) {
      console.error("Error creating chat room:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="createChatRoom">
      <div className="createChatRoomContainer">
        <div className="createChatRoomHeader">
          <h3>Create Chat Room</h3>
          <button className="closeButton" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="inputGroup">
            <label htmlFor="roomName">Room Name</label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              required
            />
          </div>

          <div className="privateToggle">
            <label htmlFor="isPrivate">Private Room</label>
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
          </div>

          <div className="searchUserSection">
            <label>Add Members</label>
            <input
              type="text"
              placeholder="Search users..."
              value={searchInput}
              onChange={handleSearchChange}
              className="userSearchInput"
            />

            <div className="selectedUsersContainer">
              {selectedUsers.length > 0 && (
                <>
                  <p className="selectedUsersTitle">
                    Selected Users ({selectedUsers.length})
                  </p>
                  <div className="selectedUsersList">
                    {selectedUsers.map((user) => (
                      <div
                        className="selectedUserChip"
                        key={`selected-${user.id}`}
                      >
                        <span>{user.username}</span>
                        <button
                          type="button"
                          className="removeUserBtn"
                          onClick={() => handleUserSelect(user)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="userListContainer">
              {filteredUsers.map((user) => (
                <div
                  className={`userItem ${
                    selectedUsers.some((u) => u.id === user.id)
                      ? "selected"
                      : ""
                  }`}
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="userDetail">
                    <img src={user.avatar || "./avatar.png"} alt="" />
                    <span>{user.username}</span>
                  </div>
                  <div className="selectIndicator">
                    {selectedUsers.some((u) => u.id === user.id) ? "✓" : "+"}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="noUsersFound">No users found.</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="createRoomBtn"
            disabled={isLoading || roomName.trim() === ""}
          >
            {isLoading ? "Creating..." : "Create Room"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateChatRoom;
