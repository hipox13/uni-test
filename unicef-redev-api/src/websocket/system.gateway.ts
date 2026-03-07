import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * System Gateway - Broadcaster for background processes (Retries, Syncs, etc.)
 */
@WebSocketGateway({
    cors: { origin: '*', credentials: true },
    namespace: '/system',
})
export class SystemGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger('SystemGateway');

    handleConnection(client: Socket) {
        this.logger.log(`Admin/System client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Admin/System client disconnected: ${client.id}`);
    }

    /**
     * Broadcast a system event to all connected clients.
     * Useful for real-time logs/notifications on the dashboard.
     */
    broadcast(event: string, data: any) {
        this.server.emit(event, {
            ...data,
            timestamp: new Date().toISOString(),
        });
        this.logger.log(`Broadcasted system event: ${event}`);
    }
}
