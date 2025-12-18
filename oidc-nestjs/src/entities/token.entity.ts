import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from "typeorm";
import { Application } from "./application.entity";
import { Authorization } from "./authorization.entity";

@Entity("openiddict_tokens")
export class Token {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: true })
  application_id: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: "application_id" })
  application: Application;

  @Column({ type: "varchar", length: 255, nullable: true })
  authorization_id: string;

  @ManyToOne(() => Authorization)
  @JoinColumn({ name: "authorization_id" })
  authorization: Authorization;

  @Column({ type: "datetime", nullable: true })
  creation_date: Date;

  @Column({ type: "datetime", nullable: true })
  expiration_date: Date;

  @Column({ type: "longtext", nullable: true })
  payload: string;

  @Column({ type: "json", nullable: true })
  properties: any;

  @Column({ type: "datetime", nullable: true })
  redemption_date: Date;

  @Column({ type: "varchar", length: 100, nullable: true, unique: true })
  reference_id: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  status: string;

  @Column({ type: "varchar", length: 400, nullable: true })
  subject: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  type: string;

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
