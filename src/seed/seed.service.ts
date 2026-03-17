import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import UserRole from 'src/auth/enum/role.enum';
import { UserService } from 'src/users/user/user.service';

@Injectable()
export class SeedingService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async seed(): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env');
    }

    const adminUser = await this.userService.findOneBy({
      email: adminEmail,
      role: UserRole.ADMIN,
    });

    if (!adminUser) {
      await this.userService.createAdmin({
        firstName: 'Admin',
        lastName: 'Agence',
        email: adminEmail,
        password: adminPassword,
        role: UserRole.ADMIN,
      });
      console.log('✅ Admin créé avec succès');
      return;
    }

    const isPasswordMatch = await bcrypt.compare(
      adminPassword,
      adminUser.password,
    );

    if (!isPasswordMatch) {
      await this.userService.updateAdmin(adminUser.id, {
        password: adminPassword,
      });
      console.log('✅ Mot de passe admin mis à jour');
      return;
    }

    console.log('✅ Admin déjà existant, aucune action nécessaire');
  }
}
