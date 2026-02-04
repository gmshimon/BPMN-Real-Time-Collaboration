import { Module } from '@nestjs/common';
import { CollabGateway } from './collab.gateway';
import { CollabService } from './collab.service';

@Module({
  providers: [CollabGateway, CollabService]
})
export class CollabModule {}
