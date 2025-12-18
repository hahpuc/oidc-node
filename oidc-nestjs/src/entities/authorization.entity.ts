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

@Entity("openiddict_authorizations")
export class Authorization {
  @Column({ type: "varchar", length: 255, primary: true })
  id: string;

  @Column({ type: "uuid", nullable: true })
  application_id: string;

  @ManyToOne(() => Application)
  @JoinColumn({ name: "application_id" })
  application: Application;

  @Column({ type: "datetime", nullable: true })
  creation_date: Date;

  @Column({ type: "json", nullable: true })
  properties: any;

  @Column({ type: "json", nullable: true })
  scopes: string[];

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
