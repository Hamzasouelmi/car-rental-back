import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RoleGuard } from 'src/shared/common/guards/role.guard';
import { GetCurrentUser } from 'src/shared/common/decorators/current-user.decorator';
import { User } from './user.entity';
import UserRole from 'src/auth/enum/role.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(RoleGuard(UserRole.ADMIN))
  findAll() {
    return this.userService.findAll();
  }

  @Get('me')
  @UseGuards(RoleGuard(UserRole.ADMIN))
  getMe(@GetCurrentUser() user: User) {
    return user;
  }

  @Get(':id')
  @UseGuards(RoleGuard(UserRole.ADMIN))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  @UseGuards(RoleGuard(UserRole.ADMIN))
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RoleGuard(UserRole.ADMIN))
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard(UserRole.ADMIN))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @Patch(':id/toggle-active')
  @UseGuards(RoleGuard(UserRole.ADMIN))
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.userService.toggleActive(id);
  }
}
