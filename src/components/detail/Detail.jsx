import {
  arrayRemove,
  arrayUnion,
  doc,
  updateDoc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css";

const Detail = () => {
  const {
    chatId,
    user,
    isCurrentUserBlocked,
    isReceiverBlocked,
    changeBlock,
    resetChat,
    isRoom,
  } = useChatStore();
  const { currentUser } = useUserStore();
  const [roomMembers, setRoomMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch room members if this is a chat room
  useEffect(() => {
    const fetchRoomDetails = async () => {
      if (!isRoom || !chatId) return;

      try {
        // Get room details
        const roomRef = doc(db, "chatRooms", chatId);
        const roomSnap = await getDoc(roomRef);

        if (roomSnap.exists()) {
          const roomData = roomSnap.data();
          const memberIds = roomData.members || [];

          // Get member details
          const memberPromises = memberIds.map(async (memberId) => {
            const userDocRef = doc(db, "users", memberId);
            const userDocSnap = await getDoc(userDocRef);
            return { ...userDocSnap.data(), id: memberId };
          });

          const members = await Promise.all(memberPromises);
          setRoomMembers(members);

          // Check if current user is an admin
          const userRoomRef = doc(
            db,
            "userchats",
            currentUser.id,
            "rooms",
            chatId
          );
          const userRoomSnap = await getDoc(userRoomRef);

          if (userRoomSnap.exists()) {
            setIsAdmin(userRoomSnap.data().isAdmin || false);
          }
        }
      } catch (err) {
        console.error("Error fetching room details:", err);
      }
    };

    fetchRoomDetails();
  }, [chatId, isRoom, currentUser.id]);

  const handleBlock = async () => {
    if (!user) return;

    const userDocRef = doc(db, "users", currentUser.id);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.log(err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!isRoom || !chatId || !isAdmin) return;

    try {
      // Update the room's members list
      const roomRef = doc(db, "chatRooms", chatId);
      await updateDoc(roomRef, {
        members: arrayRemove(memberId),
      });

      // Remove the room from the user's rooms collection
      const userRoomRef = doc(db, "userchats", memberId, "rooms", chatId);

      try {
        await updateDoc(userRoomRef, {
          removed: true,
          removedAt: new Date().getTime(),
        });
      } catch (err) {
        console.error("Error updating user room reference:", err);
      }

      // Update the local state to reflect the change
      setRoomMembers((prev) => prev.filter((member) => member.id !== memberId));
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    resetChat();
  };

  return (
    <div className="detail">
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h2>{user?.username}</h2>
        {isRoom ? <p>Chat Room</p> : <p>Lorem ipsum dolor sit amet.</p>}
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        {isRoom && (
          <div className="option">
            <div className="title">
              <span>Room Members</span>
              <img src="./arrowDown.png" alt="" />
            </div>
            <div className="members">
              {roomMembers.map((member) => (
                <div key={member.id} className="memberItem">
                  <div className="memberDetail">
                    <img src={member.avatar || "./avatar.png"} alt="" />
                    <span>{member.username}</span>
                    {member.id === currentUser.id && (
                      <span className="you">(You)</span>
                    )}
                  </div>
                  {isAdmin && member.id !== currentUser.id && (
                    <button
                      className="removeBtn"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="option">
          <div className="title">
            <span>Privacy & help</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared photos</span>
            <img src="./arrowDown.png" alt="" />
          </div>
          <div className="photos">
            <div className="photoItem">
              <div className="photoDetail">
                <img
                  src="https://images.pexels.com/photos/7381200/pexels-photo-7381200.jpeg?auto=compress&cs=tinysrgb&w=800&lazy=load"
                  alt=""
                />
                <span>photo_2024_2.png</span>
              </div>
              <img src="./download.png" alt="" className="icon" />
            </div>
            <div className="photoItem">
              <div className="photoDetail">
                <img
                  src="https://images.pexels.com/photos/7381200/pexels-photo-7381200.jpeg?auto=compress&cs=tinysrgb&w=800&lazy=load"
                  alt=""
                />
                <span>photo_2024_2.png</span>
              </div>
              <img src="./download.png" alt="" className="icon" />
            </div>
            <div className="photoItem">
              <div className="photoDetail">
                <img
                  src="https://images.pexels.com/photos/7381200/pexels-photo-7381200.jpeg?auto=compress&cs=tinysrgb&w=800&lazy=load"
                  alt=""
                />
                <span>photo_2024_2.png</span>
              </div>
              <img src="./download.png" alt="" className="icon" />
            </div>
            <div className="photoItem">
              <div className="photoDetail">
                <img
                  src="https://images.pexels.com/photos/7381200/pexels-photo-7381200.jpeg?auto=compress&cs=tinysrgb&w=800&lazy=load"
                  alt=""
                />
                <span>photo_2024_2.png</span>
              </div>
              <img src="./download.png" alt="" className="icon" />
            </div>
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="./arrowUp.png" alt="" />
          </div>
        </div>
        {!isRoom && (
          <button onClick={handleBlock}>
            {isCurrentUserBlocked
              ? "You are Blocked!"
              : isReceiverBlocked
              ? "User blocked"
              : "Block User"}
          </button>
        )}
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;
