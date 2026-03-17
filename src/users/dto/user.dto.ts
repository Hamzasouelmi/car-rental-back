import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { Exclude } from 'class-transformer';
import { BaseDTO } from 'src/shared/utils/dto/base.dto';
import UserRole from 'src/auth/enum/role.enum';

export class UserDTO extends BaseDTO {
  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Exclude()
  password?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString({ each: true })
  @IsOptional()
  authorities?: UserRole[];

  @Exclude()
  resetToken?: string;

  @Exclude()
  hashedRt?: string;

  @Exclude()
  isSuperAdmin?: boolean;

  @IsBoolean()
  @IsOptional()
  isActivated?: boolean;
}
