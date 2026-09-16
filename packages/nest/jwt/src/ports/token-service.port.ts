export const TOKEN_SERVICE = Symbol("TOKEN_SERVICE");

// Empty base — consumers extend this via module augmentation:
// declare module "@signa/nest-jwt" {
//   interface JwtPayload { sub: string; role: string; }
// }
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
export interface JwtPayload {}

export interface TokenService {
  sign(payload: JwtPayload): Promise<string>;
  verify<T extends object = JwtPayload>(token: string): Promise<T>;
}
