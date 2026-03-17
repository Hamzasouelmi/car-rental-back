import { Request } from 'express';
import { User } from 'src/users/user/user.entity';

export interface RequestWithUser extends Request {
  user: User;
}
