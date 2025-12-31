import appRoot from 'app-root-path'
import {
  format as _format,
  createLogger,
  transports as _transports,
} from 'winston'
import path from 'path'

const { combine, timestamp, label, json, prettyPrint, errors, metadata } =
  _format

const infoOptions = {
  file: {
    level: 'info',
    filename: 'app.log',
    handleExceptions: true,
    handleRejections: true,
    maxsize: 1024 * 1024 * 5, // 5MB
    maxFiles: 5,
  },
}

const errorOptions = {
  file: {
    level: 'error',
    filename: 'error.log',
    handleExceptions: true,
    handleRejections: true,
    maxsize: 1024 * 1024 * 5, // 5MB
    maxFiles: 5,
  },
  console: {
    level: 'error',
    handleExceptions: true,
  },
}

const baseLogsDir = path.join(appRoot.path, 'logs')
const logger = createLogger({
  format: combine(
    metadata({ key: 'stechmeta' }),
    errors({ stack: true }),
    label({ label: 'stech' }),
    timestamp(),
    json(),
    prettyPrint()
  ),
  transports: [
    new _transports.File({ ...infoOptions.file, dirname: baseLogsDir }),
    new _transports.File({ ...errorOptions.file, dirname: baseLogsDir }),
    new _transports.Console(errorOptions.console),
  ],
  exceptionHandlers: [
    new _transports.File({ dirname: baseLogsDir, filename: 'exceptions.log' }),
  ],
  rejectionHandlers: [
    new _transports.File({ dirname: baseLogsDir, filename: 'rejections.log' }),
  ],
  exitOnError: false,
})

export default logger
