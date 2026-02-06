import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(): Socket {
  if (socket) return socket

  const url = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"

  socket = io(url, {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
  })

  return socket
}
