import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPointToComment1729082105747 implements MigrationInterface {
    name = 'AddPointToComment1729082105747'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "market_comment" ADD "point" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "market_comment" DROP COLUMN "point"`);
    }

}
