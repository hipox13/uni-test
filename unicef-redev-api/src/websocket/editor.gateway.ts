import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

const COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#F97316', '#A855F7', '#14B8A6', '#EC4899', '#F59E0B'];

interface RoomUser {
  userId: number;
  name: string;
  color: string;
}

@WebSocketGateway({ cors: { origin: '*', credentials: true }, namespace: '/editor' })
export class EditorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger('EditorGateway');

  private rooms = new Map<string, Map<string, RoomUser>>();
  private clientRooms = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const pageId = this.clientRooms.get(client.id);
    if (!pageId) return;
    const room = this.rooms.get(pageId);
    if (room) {
      room.delete(client.id);
      if (room.size === 0) this.rooms.delete(pageId);
      else this.server.to(pageId).emit('presence:users', [...room.values()]);
    }
    this.clientRooms.delete(client.id);
    this.server.to(pageId).emit('cursor:update', { clientId: client.id, left: true });
  }

  @SubscribeMessage('presence:join')
  handleJoin(client: Socket, data: { pageId: string; userId: number; name: string }) {
    const { pageId, userId, name } = data;

    // Leave previous room if any
    const prev = this.clientRooms.get(client.id);
    if (prev) {
      client.leave(prev);
      this.rooms.get(prev)?.delete(client.id);
    }

    client.join(pageId);
    this.clientRooms.set(client.id, pageId);

    if (!this.rooms.has(pageId)) this.rooms.set(pageId, new Map());
    const room = this.rooms.get(pageId)!;
    const color = COLORS[room.size % COLORS.length];
    room.set(client.id, { userId, name, color });

    this.server.to(pageId).emit('presence:users', [...room.values()]);
    return { color };
  }

  @SubscribeMessage('cursor:move')
  handleCursorMove(client: Socket, data: { x: number; y: number }) {
    const pageId = this.clientRooms.get(client.id);
    if (!pageId) return;
    const user = this.rooms.get(pageId)?.get(client.id);
    if (!user) return;
    client.to(pageId).emit('cursor:update', {
      clientId: client.id,
      x: data.x,
      y: data.y,
      name: user.name,
      color: user.color,
    });
  }

  @SubscribeMessage('content:update')
  handleContentUpdate(client: Socket, data: { nodes: string }) {
    const pageId = this.clientRooms.get(client.id);
    if (!pageId) return;
    const user = this.rooms.get(pageId)?.get(client.id);
    if (!user) return;
    this.logger.debug(`Content update from ${user.name} in page ${pageId}`);
    // Broadcast to all OTHER clients in the room
    client.to(pageId).emit('content:update', {
      nodes: data.nodes,
      userId: user.userId,
      name: user.name,
    });
  }
}
