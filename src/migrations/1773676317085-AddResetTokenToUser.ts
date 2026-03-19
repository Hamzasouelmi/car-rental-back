import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResetTokenToUser1773676317085 implements MigrationInterface {
  name = 'AddResetTokenToUser1773676317085';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "resetToken" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetToken"`);
  }
}
