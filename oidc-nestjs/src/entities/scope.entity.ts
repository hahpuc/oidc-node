import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
} from "typeorm";

@Entity("openiddict_scopes")
export class Scope {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "json", nullable: true })
  descriptions: any;

  @Column({ type: "text", nullable: true })
  display_name: string;

  @Column({ type: "json", nullable: true })
  display_names: any;

  @Column({ type: "varchar", length: 200, nullable: true, unique: true })
  name: string;

  @Column({ type: "json", nullable: true })
  properties: any;

  @Column({ type: "json", nullable: true })
  resources: string[];

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
