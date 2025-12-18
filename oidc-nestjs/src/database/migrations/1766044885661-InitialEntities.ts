import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialEntities1766044885661 implements MigrationInterface {
  name = "InitialEntities1766044885661";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`openiddict_applications\` (\`id\` varchar(36) NOT NULL, \`application_type\` varchar(50) NULL, \`client_id\` varchar(100) NULL, \`client_secret\` text NULL, \`client_type\` varchar(50) NULL, \`consent_type\` varchar(50) NULL, \`display_name\` text NULL, \`display_names\` json NULL, \`json_web_key_set\` json NULL, \`permissions\` json NULL, \`post_logout_redirect_uris\` json NULL, \`properties\` json NULL, \`redirect_uris\` json NULL, \`requirements\` json NULL, \`settings\` json NULL, \`client_uri\` text NULL, \`logo_uri\` text NULL, \`extra_properties\` json NULL, \`concurrency_stamp\` varchar(40) NOT NULL, \`creation_time\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`creator_id\` varchar(255) NULL, \`last_modification_time\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`last_modifier_id\` varchar(255) NULL, \`is_deleted\` tinyint NOT NULL DEFAULT 0, \`deleter_id\` varchar(255) NULL, \`deletion_time\` datetime(6) NULL, UNIQUE INDEX \`IDX_6d6055c02f17c19af32cb979f5\` (\`client_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`openiddict_authorizations\` (\`id\` varchar(255) NOT NULL, \`application_id\` varchar(255) NULL, \`creation_date\` datetime NULL, \`properties\` json NULL, \`scopes\` json NULL, \`status\` varchar(50) NULL, \`subject\` varchar(400) NULL, \`type\` varchar(50) NULL, \`extra_properties\` json NULL, \`concurrency_stamp\` varchar(40) NOT NULL, \`creation_time\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`creator_id\` varchar(255) NULL, \`last_modification_time\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`last_modifier_id\` varchar(255) NULL, \`is_deleted\` tinyint NOT NULL DEFAULT 0, \`deleter_id\` varchar(255) NULL, \`deletion_time\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`openiddict_scopes\` (\`id\` varchar(36) NOT NULL, \`description\` text NULL, \`descriptions\` json NULL, \`display_name\` text NULL, \`display_names\` json NULL, \`name\` varchar(200) NULL, \`properties\` json NULL, \`resources\` json NULL, \`extra_properties\` json NULL, \`concurrency_stamp\` varchar(40) NOT NULL, \`creation_time\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`creator_id\` varchar(255) NULL, \`last_modification_time\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`last_modifier_id\` varchar(255) NULL, \`is_deleted\` tinyint NOT NULL DEFAULT 0, \`deleter_id\` varchar(255) NULL, \`deletion_time\` datetime(6) NULL, UNIQUE INDEX \`IDX_fa7b2b7531d8b1983953289b9c\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`openiddict_tokens\` (\`id\` varchar(36) NOT NULL, \`application_id\` varchar(255) NULL, \`authorization_id\` varchar(255) NULL, \`creation_date\` datetime NULL, \`expiration_date\` datetime NULL, \`payload\` longtext NULL, \`properties\` json NULL, \`redemption_date\` datetime NULL, \`reference_id\` varchar(100) NULL, \`status\` varchar(50) NULL, \`subject\` varchar(400) NULL, \`type\` varchar(50) NULL, \`extra_properties\` json NULL, \`concurrency_stamp\` varchar(40) NOT NULL, \`creation_time\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`creator_id\` varchar(255) NULL, \`last_modification_time\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`last_modifier_id\` varchar(255) NULL, \`is_deleted\` tinyint NOT NULL DEFAULT 0, \`deleter_id\` varchar(255) NULL, \`deletion_time\` datetime(6) NULL, UNIQUE INDEX \`IDX_93daa6ff8e9614eac98529c0ef\` (\`reference_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`username\` varchar(100) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`email_verified\` tinyint NOT NULL DEFAULT 1, \`given_name\` varchar(100) NULL, \`family_name\` varchar(100) NULL, \`name\` varchar(200) NULL, \`picture\` varchar(255) NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `ALTER TABLE \`openiddict_authorizations\` ADD CONSTRAINT \`FK_b7545de62e424892bd87d46919e\` FOREIGN KEY (\`application_id\`) REFERENCES \`openiddict_applications\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`openiddict_tokens\` ADD CONSTRAINT \`FK_489b310627a3ba444985af104af\` FOREIGN KEY (\`application_id\`) REFERENCES \`openiddict_applications\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`openiddict_tokens\` ADD CONSTRAINT \`FK_9c3e10e2e65de8ac5b3631bbbd8\` FOREIGN KEY (\`authorization_id\`) REFERENCES \`openiddict_authorizations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`openiddict_tokens\` DROP FOREIGN KEY \`FK_9c3e10e2e65de8ac5b3631bbbd8\``
    );
    await queryRunner.query(
      `ALTER TABLE \`openiddict_tokens\` DROP FOREIGN KEY \`FK_489b310627a3ba444985af104af\``
    );
    await queryRunner.query(
      `ALTER TABLE \`openiddict_authorizations\` DROP FOREIGN KEY \`FK_b7545de62e424892bd87d46919e\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_93daa6ff8e9614eac98529c0ef\` ON \`openiddict_tokens\``
    );
    await queryRunner.query(`DROP TABLE \`openiddict_tokens\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_fa7b2b7531d8b1983953289b9c\` ON \`openiddict_scopes\``
    );
    await queryRunner.query(`DROP TABLE \`openiddict_scopes\``);
    await queryRunner.query(`DROP TABLE \`openiddict_authorizations\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_6d6055c02f17c19af32cb979f5\` ON \`openiddict_applications\``
    );
    await queryRunner.query(`DROP TABLE \`openiddict_applications\``);
  }
}
