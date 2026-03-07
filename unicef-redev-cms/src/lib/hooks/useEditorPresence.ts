import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/stores/authStore';

export interface CursorPosition {
  x: number;
  y: number;
  name: string;
  color: string;
}

export interface CollaboratorInfo {
  userId: number;
  name: string;
  color: string;
}

export interface ContentUpdate {
  nodes: string;
  userId: number;
  name: string;
}

const WS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useEditorPresence(
  pageId: string | undefined,
  onContentUpdate?: (data: ContentUpdate) => void,
) {
  const [users, setUsers] = useState<CollaboratorInfo[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const socketRef = useRef<Socket | null>(null);
  const lastEmit = useRef(0);
  const lastContentEmit = useRef(0);

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // Keep a stable ref to the callback so we don't re-create the socket
  const contentCbRef = useRef(onContentUpdate);
  contentCbRef.current = onContentUpdate;

  useEffect(() => {
    if (!pageId || !user || !token) return;

    const socket = io(`${WS_URL}/editor`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Editor WebSocket connected:', socket.id);
      socket.emit('presence:join', { pageId, userId: user.id, name: user.name });
    });

    socket.on('connect_error', (err) => {
      console.error('Editor WebSocket connection error:', err.message);
    });

    socket.on('presence:users', (list: CollaboratorInfo[]) => {
      setUsers(list.filter((u) => u.userId !== user.id));
    });

    socket.on('cursor:update', (data: CursorPosition & { clientId: string; left?: boolean }) => {
      setCursors((prev) => {
        const next = new Map(prev);
        if (data.left) next.delete(data.clientId);
        else next.set(data.clientId, { x: data.x, y: data.y, name: data.name, color: data.color });
        return next;
      });
    });

    socket.on('content:update', (data: ContentUpdate) => {
      console.log(`Content update from ${data.name}`);
      contentCbRef.current?.(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setCursors(new Map());
      setUsers([]);
    };
  }, [pageId, user, token]);

  const emitCursorMove = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastEmit.current < 50) return;
    lastEmit.current = now;
    socketRef.current?.emit('cursor:move', { x, y });
  }, []);

  const emitContentUpdate = useCallback((serializedNodes: string) => {
    const now = Date.now();
    // Throttle content updates to max once per 300ms
    if (now - lastContentEmit.current < 300) return;
    lastContentEmit.current = now;
    socketRef.current?.emit('content:update', { nodes: serializedNodes });
  }, []);

  return { users, cursors, emitCursorMove, emitContentUpdate };
}
