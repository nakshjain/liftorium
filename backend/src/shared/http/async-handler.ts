import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRouteHandler = (request: Request, response: Response, next: NextFunction) => Promise<void>;

export const asyncHandler =
  (handler: AsyncRouteHandler): RequestHandler =>
  (request, response, next) => {
    handler(request, response, next).catch(next);
  };
