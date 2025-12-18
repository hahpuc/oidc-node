import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, is_active: true },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username, is_active: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, is_active: true },
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  async authenticate(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (!user) {
      return null;
    }

    const isValid = await this.validatePassword(user, password);
    if (!isValid) {
      return null;
    }

    console.log("🔍 UserService.authenticate - user object:", {
      id: user.id,
      username: user.username,
      email: user.email,
      typeofId: typeof user.id,
      keys: Object.keys(user),
    });

    return user;
  }

  async create(userData: {
    username: string;
    password: string;
    email: string;
    given_name?: string;
    family_name?: string;
    name?: string;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const user = this.userRepository.create({
      ...userData,
      password_hash: passwordHash,
      email_verified: true,
      is_active: true,
    });

    return this.userRepository.save(user);
  }
}
