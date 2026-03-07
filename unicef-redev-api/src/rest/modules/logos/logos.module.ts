import { Module } from '@nestjs/common';
import { LogosController } from './logos.controller';
import { LogosService } from './logos.service';
import { MediaModule } from '../media/media.module';
import { PrismaModule } from '../../../shared/prisma/prisma.module';

@Module({
    imports: [PrismaModule, MediaModule],
    controllers: [LogosController],
    providers: [LogosService],
    exports: [LogosService],
})
export class LogosModule { }
