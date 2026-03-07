import { Module } from '@nestjs/common';
import { EditorGateway } from './editor.gateway';
import { SystemGateway } from './system.gateway';

@Module({
  providers: [EditorGateway, SystemGateway],
  exports: [SystemGateway],
})
export class WebSocketModule { }
