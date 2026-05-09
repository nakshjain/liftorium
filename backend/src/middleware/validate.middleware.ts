import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export const validateBody =
  <TBody>(schema: ZodSchema<TBody>) =>
  (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.parse(request.body);
    request.body = result;
    next();
  };

export const validateQuery =
  <TQuery>(schema: ZodSchema<TQuery>) =>
  (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.parse(request.query);
    request.query = result as Request["query"];
    next();
  };

export const validateParams =
  <TParams>(schema: ZodSchema<TParams>) =>
  (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.parse(request.params);
    request.params = result as Request["params"];
    next();
  };
