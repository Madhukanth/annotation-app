import httpStatus from 'http-status'

import ExtendableError from './extendable-error'

class APIError extends ExtendableError {
  constructor(
    public message: string,
    public status: number = httpStatus.INTERNAL_SERVER_ERROR,
    public stack: string = '',
    public errors: {
      field: string
      location: string
      messages: string[]
    }[] = [],
    public isPublic: boolean = false
  ) {
    super(message, status, stack, errors, isPublic)
  }
}

export default APIError
