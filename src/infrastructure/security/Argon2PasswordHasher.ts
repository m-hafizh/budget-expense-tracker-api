import argon2 from "argon2";
import { PasswordHasher } from "../../application/use-cases/auth/auth.ports";

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plainTextPassword: string): Promise<string> {
    return argon2.hash(plainTextPassword, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async verify(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
    return argon2.verify(hashedPassword, plainTextPassword);
  }
}
