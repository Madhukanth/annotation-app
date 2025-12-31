import { NextFunction, Request, Response, ErrorRequestHandler } from 'express'
import httpStatus, { HttpStatusClasses, HttpStatusExtra } from 'http-status'

import logger from '../config/logger'
import variables from '../config/vars'
import APIError from '../errors/api-error'

/**
 * Error handler. Send stacktrace only during development
 * @public
 */
export const handler = (err: APIError, req: Request, res: Response) => {
  logger.error(err.message, {
    method: req.method,
    endpoint: req.originalUrl,
    status: err.status || 500,
    stack: err.stack,
    ip: req.ip,
  })

  const response: {
    code: typeof err.status
    message: typeof err.message | number | HttpStatusClasses | HttpStatusExtra
    errors: typeof err.errors
    stack?: typeof err.stack
  } = {
    code: err.status,
    message:
      err.message || httpStatus[err.status] || httpStatus.INTERNAL_SERVER_ERROR,
    errors: err.errors,
  }

  if (variables.NODE_ENV === 'development') {
    response.stack = err.stack
  }

  return res.status(err.status).json(response)
}

/**
 * If error is not an instanceOf APIError, convert it.
 * @public
 */
export const converter: ErrorRequestHandler = (
  err,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let convertedError = err
  if (!(err instanceof APIError)) {
    convertedError = new APIError(err.message, err.status, err.stack)
  }

  return handler(convertedError, req, res)
}

/**
 * Catch 404 and forward to error handler
 * @public
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const err = new APIError('Not found', httpStatus.NOT_FOUND)
  return handler(err, req, res)
}
