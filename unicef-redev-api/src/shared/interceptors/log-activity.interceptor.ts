import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { LOG_ACTIVITY_KEY } from './log-activity.decorator';

const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

@Injectable()
export class LogActivityInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const feature = this.reflector.get<string>(
      LOG_ACTIVITY_KEY,
      context.getHandler(),
    );

    if (!feature) return next.handle();

    const req = context.switchToHttp().getRequest();
    const method = req.method as string;
    const action = METHOD_ACTION_MAP[method] ?? method.toLowerCase();
    const dataId = req.params?.id?.toString() ?? null;
    const userId = req.user?.id ?? null;
    const ipAddress = req.ip ?? null;

    return next.handle().pipe(
      tap(() => {
        this.prisma.uniLogActivity
          .create({
            data: {
              feature,
              action,
              dataId,
              userId,
              ipAddress,
              dateCreated: new Date(),
            },
          })
          .catch((err) => console.warn('LogActivity write failed:', err.message));
      }),
    );
  }
}
