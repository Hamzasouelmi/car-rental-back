import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RequestWithUser } from 'src/types/request-with-user';
import { User } from 'src/users/user/user.entity';

export const GetCurrentUser = createParamDecorator(
  (data: keyof User | undefined, context: ExecutionContext): unknown => {
    const request: RequestWithUser = context.switchToHttp().getRequest();

    if (!data) {
      return request?.user;
    }

    const logger = new Logger('CurrentUserDecorator');
    const value = request?.user[data];

    if (!value) {
      logger.log(`Request.user[${String(data)}] is Null`);
      throw new InternalServerErrorException();
    }

    return value;
  },
);
