import { AuthenticatedUser } from "../domain/entities/Auth";

declare global {
	namespace Express {
		interface Request {
			authUser?: AuthenticatedUser;
		}
	}
}

export {};
