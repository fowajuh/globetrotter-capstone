import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  async signup(@Body() body: unknown) {
    const parsed = SignupDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.auth.signup(parsed.data);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown) {
    const parsed = LoginDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.auth.login(parsed.data);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: unknown) {
    const parsed = RefreshDto.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException(parsed.error.issues);
    return this.auth.refresh(parsed.data.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() body: unknown) {
    const parsed = RefreshDto.safeParse(body);
    // Best-effort: if no valid refresh token sent, just return ok
    if (!parsed.success) return { ok: true };
    return this.auth.logoutByRefreshToken(parsed.data.refreshToken);
  }
}
