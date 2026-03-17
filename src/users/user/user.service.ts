import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import UserRole from 'src/auth/enum/role.enum';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ─── SEED ────────────────────────────────────────────────────────────────────

  async findOneBy(where: FindOptionsWhere<User>): Promise<User | null> {
    return this.userRepository.findOneBy(where);
  }

  async createAdmin(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const admin = this.userRepository.create({
      ...data,
      password: hashedPassword,
      isEmailVerified: true,
      isActive: true,
    });
    return this.userRepository.save(admin);
  }

  async updateAdmin(id: number, data: { password: string }): Promise<void> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    await this.userRepository.update(id, { password: hashedPassword });
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'role',
        'isActive',
        'isEmailVerified',
        'createdAt',
      ],
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'phone',
        'role',
        'isActive',
        'isEmailVerified',
        'createdAt',
      ],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const user = this.userRepository.create({ ...dto });
    return this.userRepository.save(user);
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async toggleActive(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  async updatePassword(id: number, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, { password: hashedPassword });
  }
  async updateHashedRefreshToken(
    userId: number,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      hashedRefreshToken: hashedRefreshToken ?? undefined,
    });
  }
  async getUserIfRefreshTokenMatches(
    userId: number,
    refreshToken: string,
  ): Promise<User> {
    const user = await this.findOne(userId);

    if (!user.hashedRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!isRefreshTokenMatching) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return user;
  }
  async markEmailAsVerified(email: string): Promise<void> {
    await this.userRepository.update(
      { email },
      { isEmailVerified: true, isActivated: true },
    );
  }
}
