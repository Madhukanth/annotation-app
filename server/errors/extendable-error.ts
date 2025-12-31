import httpStatus from 'http-status'

class ExtendableError extends Error {
  constructor(
    public message: string,
    public status: number = httpStatus.INTERNAL_SERVER_ERROR,
    public stack: string = '',
    public errors: {
      field: string
      location: string
      messages: string[]
    }[] = [],
    public isPublic: boolean = false,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export default ExtendableError
