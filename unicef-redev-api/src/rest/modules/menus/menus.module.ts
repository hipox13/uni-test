import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { MenusService } from './menus.service';
import { MenusGateway } from './menus.gateway';

/**
 * Menus Module - Navigation menu management with tree structure.
 */
@Module({
  controllers: [MenusController],
  providers: [MenusService, MenusGateway],
  exports: [MenusService],
})
export class MenusModule { }
