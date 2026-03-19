import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVehiclePricing1773849044214 implements MigrationInterface {
  name = 'UpdateVehiclePricing1773849044214';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_pricings" DROP COLUMN "pricePerDay"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN "basePricePerDay"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_pricings" ADD "pricePerDayTND" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_pricings" ADD "pricePerDayUSD" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_pricings" ADD "pricePerDayEUR" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "basePricePerDayTND" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "basePricePerDayUSD" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "basePricePerDayEUR" numeric(10,2) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN "basePricePerDayEUR"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN "basePricePerDayUSD"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN "basePricePerDayTND"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_pricings" DROP COLUMN "pricePerDayEUR"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_pricings" DROP COLUMN "pricePerDayUSD"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_pricings" DROP COLUMN "pricePerDayTND"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD "basePricePerDay" numeric(10,2) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_pricings" ADD "pricePerDay" numeric(10,2) NOT NULL`,
    );
  }
}
