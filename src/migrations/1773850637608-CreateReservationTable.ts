import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReservationTable1773850637608 implements MigrationInterface {
  name = 'CreateReservationTable1773850637608';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."reservations_status_enum" AS ENUM('pending', 'confirmed', 'cancelled', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reservations" ("id" SERIAL NOT NULL, "vehicleId" integer NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "totalPriceTND" numeric(10,2) NOT NULL, "totalPriceUSD" numeric(10,2) NOT NULL, "totalPriceEUR" numeric(10,2) NOT NULL, "status" "public"."reservations_status_enum" NOT NULL DEFAULT 'pending', "guestFirstName" character varying NOT NULL, "guestLastName" character varying NOT NULL, "guestEmail" character varying NOT NULL, "guestPhone" character varying NOT NULL, "notes" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_da95cef71b617ac35dc5bcda243" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" ADD CONSTRAINT "FK_6fb87e1394cb3af4f5745c37d7d" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reservations" DROP CONSTRAINT "FK_6fb87e1394cb3af4f5745c37d7d"`,
    );
    await queryRunner.query(`DROP TABLE "reservations"`);
    await queryRunner.query(`DROP TYPE "public"."reservations_status_enum"`);
  }
}
