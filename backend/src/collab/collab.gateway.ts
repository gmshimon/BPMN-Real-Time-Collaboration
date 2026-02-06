import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { CollabService } from './collab.service';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CollabGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly collab: CollabService) {}

  handleConnection(client: Socket) {
    // Add user with a default name (can be overwritten by presence:join)
    const fallbackName = `User-${client.id.slice(-4)}`;
    this.logger.log(
      `Client connected: ${client.id}; assigned name ${fallbackName}`,
    );
    this.collab.addUser(client.id, fallbackName);

    this.broadcastPresence();
    this.broadcastLocks();
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.collab.removeUser(client.id);

    this.broadcastPresence();
    this.broadcastLocks();
  }

  @SubscribeMessage('presence:join')
  onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { name?: string },
  ) {
    const name = (body?.name || `User-${client.id.slice(-4)}`).slice(0, 30);
    this.logger.log(`presence:join from ${client.id}; name=${name}`);
    this.collab.addUser(client.id, name);

    this.broadcastPresence();
    this.broadcastLocks();

    // send current diagram immediately to the joining client
    const state = this.collab.getDiagram();
    this.logger.debug(
      `Sending diagram:sync to ${client.id}; version=${state.version}`,
    );
    client.emit('diagram:sync', state);
  }

  @SubscribeMessage('diagram:get')
  onGet(@ConnectedSocket() client: Socket) {
    this.logger.log(`diagram:get requested by ${client.id}`);
    client.emit('diagram:sync', this.collab.getDiagram());
  }

  @SubscribeMessage('diagram:update')
  onUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { xml: string },
  ) {
    if (!body?.xml || typeof body.xml !== 'string') return;

    this.logger.log(`diagram:update received from ${client.id}`);
    const next = this.collab.updateDiagram(body.xml);
    this.logger.log(
      `diagram:update stored; version=${next.version}; sender=${client.id}`,
    );

    // broadcast to everyone else (avoid echo to sender)
    client.broadcast.emit('diagram:sync', next);
  }

  // @SubscribeMessage('lock:set')
  // onLockSet(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() body: { elementId: string },
  // ) {
  //   if (!body?.elementId) return;

  //   const ok = this.collab.setLock(body.elementId, client.id);
  //   if (ok) this.broadcastLocks();
  // }

  // @SubscribeMessage('lock:clear')
  // onLockClear(
  //   @ConnectedSocket() client: Socket,
  //   @MessageBody() body: { elementId: string },
  // ) {
  //   if (!body?.elementId) return;

  //   const ok = this.collab.clearLock(body.elementId, client.id);
  //   if (ok) this.broadcastLocks();
  // }

  private broadcastPresence() {
    const userCount = this.collab.getUsers().length;
    this.logger.debug(
      `broadcasting presence:update to all; users=${userCount}`,
    );
    this.server.emit('presence:update', { users: this.collab.getUsers() });
  }

  private broadcastLocks() {
    const lockCount = Object.keys(this.collab.getLocksPayload()).length;
    this.logger.debug(`broadcasting lock:update to all; locks=${lockCount}`);
    this.server.emit('lock:update', { locks: this.collab.getLocksPayload() });
  }
}
