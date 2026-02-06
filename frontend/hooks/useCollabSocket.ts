'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getSocket } from "@/lib/socket"

type PresencePayload = { users: number }
type LocksPayload = { locks: Record<string, unknown> }
type DiagramPayload = { xml?: string } | string

export function useCollabSocket() {
  const socket = useMemo(() => getSocket(), [])

  const [users, setUsers] = useState<number>(0)
  const [locks, setLocks] = useState<Record<string, unknown>>({})
  const [diagram, setDiagram] = useState<string>("")

  // avoid emitting join twice in strict-mode render cycle
  const joinedRef = useRef(false)

  useEffect(() => {
    if (!socket) return

    const handlePresence = (payload: PresencePayload) => {
        setUsers(payload.users.length ?? 0)
    }
    const handleLocks = (payload: LocksPayload) => setLocks(payload.locks ?? {})
    const handleDiagram = (payload: DiagramPayload) =>
      setDiagram(typeof payload === "string" ? payload : payload?.xml ?? "")

    const announcePresence = () => {
      console.log("[collab] socket connected")
      socket.emit("presence:join", {
        name: `User-${Math.floor(Math.random() * 9000 + 1000)}`,
      })
      socket.emit("diagram:get")
    }

    if (!socket.connected) {
      socket.connect()
    }

    socket.on("presence:update", handlePresence)
    socket.on("lock:update", handleLocks)
    socket.on("diagram:sync", handleDiagram)
    socket.on("connect", announcePresence)

    //Only happen once per mount
    if (!joinedRef.current) {
      joinedRef.current = true
      announcePresence()
    }

    return () => {
      socket.off("presence:update", handlePresence)
      socket.off("lock:update", handleLocks)
      socket.off("diagram:sync", handleDiagram)
      socket.off("connect", announcePresence)
    }
  }, [socket])

  const sendDiagramUpdate = useCallback(
    (xml: string) => socket.emit("diagram:update", { xml }),
    [socket]
  )

  const setLock = useCallback(
    (elementId: string) => socket.emit("lock:set", { elementId }),
    [socket]
  )

  const clearLock = useCallback(
    (elementId: string) => socket.emit("lock:clear", { elementId }),
    [socket]
  )

  return {
    socket,
    diagram,
    users,
    locks,
    sendDiagramUpdate,
    setLock,
    clearLock,
  }
}
