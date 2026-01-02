// export interface user {
//     name?: string,
//     id?: string | null
// }

export interface user {
    id?: string,
    _id?: string | object,
    name?: string,
    email?: string,
    password?: string,
    userName?: string,
    socketId?: string,
    conversationId?: string,
    avatar?: string,
    isOnline?: boolean,
    lastMessage?: string,
    lastMessageTime?: Date,
    unread?: number,
    status?: string
}