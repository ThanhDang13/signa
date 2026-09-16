import { applyDecorators, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtProtectedGuard } from "@signa/nest-jwt";

export const Protected = () => applyDecorators(UseGuards(JwtProtectedGuard), ApiBearerAuth("jwt"));
