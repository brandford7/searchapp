/*
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ActiveUser, RequestWithUser } from '../interfaces/auth.interfaces';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ActiveUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
*/
