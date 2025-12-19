import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "dotenv";
import { join } from "path";
import { Application } from "../entities/application.entity";
import { Authorization } from "../entities/authorization.entity";
import { Scope } from "../entities/scope.entity";
import { Token } from "../entities/token.entity";
import { User } from "../entities/user.entity";

config();

export const typeOrmConfig: DataSourceOptions = {
  type: "mysql",
  host: process.env.DB_HOST || "147.93.156.241",
  port: 3306,
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "Long@1234",
  database: process.env.DB_DATABASE || "test_db",
  entities: [Application, Authorization, Scope, Token, User],
  migrations: [join(__dirname, "../database/migrations/*{.ts,.js}")],
  synchronize: false,
  logging: false,
  charset: "utf8mb4",
  timezone: "Z",
};

const dataSource = new DataSource(typeOrmConfig);

export default dataSource;
