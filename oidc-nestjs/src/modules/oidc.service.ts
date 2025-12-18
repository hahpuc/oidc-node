import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, Authorization, Scope, Token } from '../entities';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OidcService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Authorization)
    private readonly authorizationRepository: Repository<Authorization>,
    @InjectRepository(Scope)
    private readonly scopeRepository: Repository<Scope>,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  // Application methods
  async findApplicationByClientId(clientId: string): Promise<Application | null> {
    return this.applicationRepository.findOne({
      where: { client_id: clientId, is_deleted: false },
    });
  }

  async createApplication(data: Partial<Application>): Promise<Application> {
    const app = this.applicationRepository.create({
      ...data,
      concurrency_stamp: uuidv4(),
      extra_properties: data.extra_properties || {},
    });
    return this.applicationRepository.save(app);
  }

  // Authorization methods
  async createAuthorization(
    data: Partial<Authorization>,
  ): Promise<Authorization> {
    const auth = this.authorizationRepository.create({
      ...data,
      concurrency_stamp: uuidv4(),
      extra_properties: data.extra_properties || {},
      creation_date: new Date(),
    });
    return this.authorizationRepository.save(auth);
  }

  async findAuthorization(id: string): Promise<Authorization | null> {
    return this.authorizationRepository.findOne({
      where: { id, is_deleted: false },
    });
  }

  async findAuthorizationsBySubject(
    subject: string,
  ): Promise<Authorization[]> {
    return this.authorizationRepository.find({
      where: { subject, is_deleted: false },
    });
  }

  // Token methods
  async createToken(data: Partial<Token>): Promise<Token> {
    const token = this.tokenRepository.create({
      ...data,
      concurrency_stamp: uuidv4(),
      extra_properties: data.extra_properties || {},
      creation_date: new Date(),
    });
    return this.tokenRepository.save(token);
  }

  async findToken(id: string): Promise<Token | null> {
    return this.tokenRepository.findOne({
      where: { id, is_deleted: false },
    });
  }

  async findTokenByReferenceId(referenceId: string): Promise<Token | null> {
    return this.tokenRepository.findOne({
      where: { reference_id: referenceId, is_deleted: false },
    });
  }

  async revokeToken(id: string): Promise<void> {
    await this.tokenRepository.update(id, {
      status: 'revoked',
      redemption_date: new Date(),
    });
  }

  async revokeTokensByAuthorizationId(authorizationId: string): Promise<void> {
    await this.tokenRepository.update(
      { authorization_id: authorizationId },
      {
        status: 'revoked',
        redemption_date: new Date(),
      },
    );
  }

  // Scope methods
  async findScopeByName(name: string): Promise<Scope | null> {
    return this.scopeRepository.findOne({
      where: { name, is_deleted: false },
    });
  }

  async findScopes(names: string[]): Promise<Scope[]> {
    return this.scopeRepository
      .createQueryBuilder('scope')
      .where('scope.name IN (:...names)', { names })
      .andWhere('scope.is_deleted = :isDeleted', { isDeleted: false })
      .getMany();
  }

  async createScope(data: Partial<Scope>): Promise<Scope> {
    const scope = this.scopeRepository.create({
      ...data,
      concurrency_stamp: uuidv4(),
      extra_properties: data.extra_properties || {},
    });
    return this.scopeRepository.save(scope);
  }
}
