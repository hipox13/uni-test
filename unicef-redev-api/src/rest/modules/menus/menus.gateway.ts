import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Menus Gateway - Handles real-time synchronization for the Figma-style "Open Editor".
 * Security: Temporarily disabled (no Auth checks) to simplify testing as per user request.
 */
@WebSocketGateway({
    cors: {
        origin: '*', // Allow all origins for easier testing
    },
    namespace: 'menus',
})
export class MenusGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('MenusGateway');

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupName: string; userName: string },
    ) {
        const room = `menu-group-${data.groupName}`;
        client.join(room);
        this.logger.log(`${data.userName} joined room: ${room}`);

        // Broadcast presence to others in the room
        client.to(room).emit('presence', {
            userId: client.id,
            userName: data.userName,
            action: 'joined',
        });
    }

    @SubscribeMessage('move_item')
    handleMoveItem(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupName: string; itemId: number; posX: number; posY: number },
    ) {
        const room = `menu-group-${data.groupName}`;

        // Broadcast the movement to everyone EXCEPT the sender
        client.to(room).emit('item_moved', {
            itemId: data.itemId,
            posX: data.posX,
            posY: data.posY,
            senderId: client.id,
        });
    }

    @SubscribeMessage('edit_item')
    handleEditItem(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { groupName: string; itemId: number; title?: string; href?: string },
    ) {
        const room = `menu-group-${data.groupName}`;

        // Broadcast the edit to everyone EXCEPT the sender
        client.to(room).emit('item_edited', {
            ...data,
            senderId: client.id,
        });
    }
}
