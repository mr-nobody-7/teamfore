import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errors.js";
import { verifyToken } from "../utils/jwt.js";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token: string | undefined = req.cookies.token;
  if (!token) {
    return next(new UnauthorizedError());
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError("Invalid token"));
  }
};
