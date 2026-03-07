import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract current authenticated user from request.
 * Usage: @CurrentUser() user: { id: number; email: string }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Set by JWT strategy/guard
  },
);
