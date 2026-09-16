import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { JwtPayload, TokenService } from "../ports/token-service.port";

@Injectable()
export class JwtAdapter implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async sign(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async verify<T extends object = JwtPayload>(token: string): Promise<T> {
    return this.jwtService.verifyAsync<T>(token);
  }
}
