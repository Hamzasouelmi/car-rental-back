import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpiresAtToReservation1774883929852 implements MigrationInterface {
    name = 'AddExpiresAtToReservation1774883929852'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservations" ADD "expiresAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservations" DROP COLUMN "expiresAt"`);
    }

}
