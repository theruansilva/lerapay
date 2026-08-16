import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) { }

  async onModuleInit() {
    await this.seedDemoUsers();
  }

  private async seedDemoUsers() {
    const defaultCredentials = {
      document: this.config.get<string>('GATEWAY_DOCUMENT', '51145071848'),
      gatewayPassword: this.config.get<string>('GATEWAY_PASSWORD', 'wg6g@ju6Lr'),
      gatewayClientCode: this.config.get<string>('GATEWAY_CLIENT_CODE', '162904'),
      gatewayStoreKey: this.config.get<string>('GATEWAY_STORE_KEY', '46a93d0406072fa9182c43cf828459dd'),
    };

    const demoUsers = [
      { email: 'merchant@lerapay.com', name: 'Lojista Lera Pay' },
      { email: 'demo@lerapay.com', name: 'Demonstração Lera Pay' },
      { email: 'merchant@lorepay.com', name: 'Lojista Lera Pay' },
    ];

    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    for (const demo of demoUsers) {
      try {
        const user = await this.userRepository.findOne({ where: { email: demo.email } });
        if (!user) {
          const newUser = this.userRepository.create({
            ...demo,
            passwordHash: defaultPasswordHash,
            ...defaultCredentials,
          });
          await this.userRepository.save(newUser);
          this.logger.log(`Created demo user: ${demo.email}`);
        } else {
          Object.assign(user, {
            document: user.document || defaultCredentials.document,
            gatewayPassword: user.gatewayPassword || defaultCredentials.gatewayPassword,
            gatewayClientCode: user.gatewayClientCode || defaultCredentials.gatewayClientCode,
            gatewayStoreKey: user.gatewayStoreKey || defaultCredentials.gatewayStoreKey,
          });
          await this.userRepository.save(user);
        }
      } catch (err) {
        this.logger.warn(`Failed to seed demo user ${demo.email}: ${err}`);
      }
    }
  }
  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      document: dto.document,
    });

    const saved = await this.userRepository.save(user);

    const token = this.generateToken(saved);
    return {
      user: {
        id: saved.id,
        email: saved.email,
        name: saved.name,
        document: saved.document,
      },
      token,
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      // Allow known demo passwords for demo accounts
      const isDemoAccount = ['merchant@lerapay.com', 'demo@lerapay.com', 'merchant@lorepay.com'].includes(user.email);
      if (isDemoAccount && (dto.password === '123456' || dto.password === 'password123')) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(dto.password, salt);
        await this.userRepository.save(user);
        isMatch = true;
      }
    }

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        document: user.document,
      },
      token,
      accessToken: token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      document: user.document,
      gatewayClientCode: user.gatewayClientCode,
      gatewayStoreKey: user.gatewayStoreKey,
    };
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
    });
  }
}
