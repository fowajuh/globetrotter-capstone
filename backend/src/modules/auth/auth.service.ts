import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, SignupDto } from './dto/signup.dto';


function ttlToMs(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;
  const n = Number(match[1]);
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]]!;
  return n * mult;
}

/**
 * Owns the `users`/`sessions` tables exclusively (§5 Stage 2: this whole
 * file — and only this file — becomes the Users Service later, unchanged).
 * Refresh tokens are stored hashed, never in plaintext, so a leaked DB
 * doesn't hand out live sessions.
 */
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('an account with this email already exists');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, name: dto.name },
    });
    return this.issueTokens(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('invalid email or password');
    }
    return this.issueTokens(user.id, user.email);
  }

  /** Magic-link / OAuth land here after upstream verification — same token issuance path. */
  async issueForVerifiedIdentity(email: string, name: string) {
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({ data: { email, name, passwordHash: null } });
    }
    return this.issueTokens(user.id, user.email);
  }



  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('invalid refresh token');
    }
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const session = await this.prisma.session.findFirst({
      where: { userId: payload.sub, refreshTokenHash: hash, expiresAt: { gt: new Date() } },
    });
    if (!session) throw new UnauthorizedException('session expired or revoked');

    // rotate: kill the old session, issue a fresh pair
    await this.prisma.session.delete({ where: { id: session.id } });
    return this.issueTokens(payload.sub, payload.email);
  }

  async logout(userId: string, refreshToken: string) {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.session.deleteMany({ where: { userId, refreshTokenHash: hash } });
    return { ok: true };
  }

  /** Revoke a session by refresh-token hash alone (no userId required). */
  async logoutByRefreshToken(refreshToken: string) {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.session.deleteMany({ where: { refreshTokenHash: hash } });
    return { ok: true };
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = this.jwt.sign(
      { sub: userId, email },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_TTL ?? '15m' },
    );
    const refreshToken = this.jwt.sign(
      { sub: userId, email, jti: randomUUID() },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: process.env.JWT_REFRESH_TTL ?? '30d' },
    );
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + ttlToMs(process.env.JWT_REFRESH_TTL ?? '30d')),
      },
    });
    return { accessToken, refreshToken };
  }
}
