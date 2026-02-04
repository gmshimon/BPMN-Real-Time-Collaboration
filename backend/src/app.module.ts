import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CollabModule } from './collab/collab.module';

@Module({
  imports: [CollabModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
