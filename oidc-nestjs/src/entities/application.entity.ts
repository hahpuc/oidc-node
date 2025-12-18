import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
} from "typeorm";

@Entity("openiddict_applications")
export class Application {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  application_type: string;

  @Column({ type: "varchar", length: 100, nullable: true, unique: true })
  client_id: string;

  @Column({ type: "text", nullable: true })
  client_secret: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  client_type: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  consent_type: string;

  @Column({ type: "text", nullable: true })
  display_name: string;

  @Column({ type: "json", nullable: true })
  display_names: any;

  @Column({ type: "json", nullable: true })
  json_web_key_set: any;

  @Column({ type: "json", nullable: true })
  permissions: string[];

  @Column({ type: "json", nullable: true })
  post_logout_redirect_uris: string[];

  @Column({ type: "json", nullable: true })
  properties: any;

  @Column({ type: "json", nullable: true })
  redirect_uris: string[];

  @Column({ type: "json", nullable: true })
  requirements: string[];

  @Column({ type: "json", nullable: true })
  settings: any;

  @Column({ type: "text", nullable: true })
  client_uri: string;

  @Column({ type: "text", nullable: true })
  logo_uri: string;

  @Column({ type: "json", nullable: true })
  extra_properties: any;

  @BeforeInsert()
  setDefaults() {
    if (!this.extra_properties) {
      this.extra_properties = {};
    }
  }

  @Column({ type: "varchar", length: 40, nullable: false })
  concurrency_stamp: string;

  @CreateDateColumn({ type: "datetime" })
  creation_time: Date;

  @Column({ type: "uuid", nullable: true })
  creator_id: string;

  @UpdateDateColumn({ type: "datetime", nullable: true })
  last_modification_time: Date;

  @Column({ type: "uuid", nullable: true })
  last_modifier_id: string;

  @Column({ type: "boolean", default: false })
  is_deleted: boolean;

  @Column({ type: "uuid", nullable: true })
  deleter_id: string;

  @DeleteDateColumn({ type: "datetime", nullable: true })
  deletion_time: Date;
}
