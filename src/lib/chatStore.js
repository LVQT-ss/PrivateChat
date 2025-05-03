import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
    chatId: null,
    user: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,
    isRoomChat: false,  // Renamed from isRoom to isRoomChat for consistency

    changeChat: (chatId, user, isRoom = false) => {
        const currentUser = useUserStore.getState().currentUser;

        // CHECK IF CURRENT USER IS BLOCKED
        if (user?.blocked?.includes(currentUser?.id)) {
            return set({
                chatId,
                user,
                isCurrentUserBlocked: true,
                isReceiverBlocked: false,
                isRoomChat: isRoom
            });
        }
        // CHECK IF RECEIVER IS BLOCKED
        else if (currentUser?.blocked?.includes(user?.id)) {
            return set({
                chatId,
                user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: true,
                isRoomChat: isRoom
            });
        }
        else {
            return set({
                chatId,
                user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: false,
                isRoomChat: isRoom
            });
        }
    },

    changeBlock: () => {
        set((state) => ({
            ...state,
            isReceiverBlocked: !state.isReceiverBlocked
        }));
    },

    resetChat: () => {
        set({
            chatId: null,
            user: null,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
            isRoomChat: false
        });
    },
}));