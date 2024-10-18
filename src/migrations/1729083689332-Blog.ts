import { MigrationInterface, QueryRunner } from "typeorm";

export class Blog1729083689332 implements MigrationInterface {
    name = 'Blog1729083689332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "blog" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "thumbnailUrl" character varying NOT NULL, "tittle" character varying NOT NULL, "content" character varying NOT NULL, "marketId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "point" integer, "walletAddress" character varying, CONSTRAINT "PK_85c6532ad065a448e9de7638571" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "blog" ADD CONSTRAINT "FK_99a8df695cd89d803d6546e4efd" FOREIGN KEY ("walletAddress") REFERENCES "user"("walletAddress") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blog" DROP CONSTRAINT "FK_99a8df695cd89d803d6546e4efd"`);
        await queryRunner.query(`DROP TABLE "blog"`);
    }

}
