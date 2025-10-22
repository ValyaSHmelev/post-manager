import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload } from '../types/access-token-payload';

export const CurrentUser = createParamDecorator(
  (data: keyof AccessTokenPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AccessTokenPayload }>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
