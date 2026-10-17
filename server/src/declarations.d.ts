declare module "cookie-parser" {
  import type { RequestHandler } from "express";
  const cookieParser: (secret?: string | string[], options?: any) => RequestHandler;
  export default cookieParser;
}

declare module "jsonwebtoken" {
  export function sign(payload: string | Buffer | object, secretOrPrivateKey: any, options?: any): string;
  export function verify(token: string, secretOrPublicKey: any, options?: any): any;
  export function decode(token: string, options?: any): any;
  const jwt: {
    sign: typeof sign;
    verify: typeof verify;
    decode: typeof decode;
  };
  export default jwt;
}

declare module "bcrypt" {
  export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>;
  const bcrypt: {
    hash: typeof hash;
    compare: typeof compare;
  };
  export default bcrypt;
}
