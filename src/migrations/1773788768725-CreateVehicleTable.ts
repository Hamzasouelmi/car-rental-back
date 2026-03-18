import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehicleTable1773788768725 implements MigrationInterface {
    name = 'CreateVehicleTable1773788768725'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vehicle_pricings" ("id" SERIAL NOT NULL, "label" character varying NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "pricePerDay" numeric(10,2) NOT NULL, "vehicleId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cd2de5ec5dfabfc57eb14fab29d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_transmission_enum" AS ENUM('manual', 'automatic')`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_fueltype_enum" AS ENUM('petrol', 'diesel', 'electric', 'hybrid')`);
        await queryRunner.query(`CREATE TYPE "public"."vehicles_category_enum" AS ENUM('economy', 'compact', 'suv', 'luxury', 'van')`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" SERIAL NOT NULL, "brand" character varying NOT NULL, "model" character varying NOT NULL, "year" integer NOT NULL, "basePricePerDay" numeric(10,2) NOT NULL, "seats" integer NOT NULL, "transmission" "public"."vehicles_transmission_enum" NOT NULL DEFAULT 'manual', "fuelType" "public"."vehicles_fueltype_enum" NOT NULL DEFAULT 'petrol', "category" "public"."vehicles_category_enum" NOT NULL DEFAULT 'economy', "mileage" integer NOT NULL DEFAULT '0', "isAvailable" boolean NOT NULL DEFAULT true, "images" text, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vehicle_pricings" ADD CONSTRAINT "FK_12a8afea70c76cbb83c91643f95" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_pricings" DROP CONSTRAINT "FK_12a8afea70c76cbb83c91643f95"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_fueltype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."vehicles_transmission_enum"`);
        await queryRunner.query(`DROP TABLE "vehicle_pricings"`);
    }

}
