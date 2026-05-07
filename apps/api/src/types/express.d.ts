import type { TokenPayload } from "./index.js";

declare global {
  namespace Express {
    interface User extends TokenPayload {}

    interface Request {
      user?: User;
      rawBody?: string;
    }
  }
}

export {};
