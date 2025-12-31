import express, { Request } from 'express'
import mongoose from 'mongoose'
import passport from 'passport'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import compress from 'compression'
import methodOverride from 'method-override'
import cors from 'cors'
import helmet from 'helmet'

import envs from './config/vars'
import routes from './routes'
import * as ErrorMiddlewares from './middlewares/error'
import { jwt } from './config/passport'
import logger from './config/logger'

async function main() {
  const app = express()

  // request logging. dev: console | production: file
  app.use((req, res, next) =>
    morgan('combined', {
      stream: {
        write: (message) => {
          logger.info(message, {
            method: req.method,
            endpoint: req.originalUrl,
            ip: req.ip,
            body: req.body,
            params: req.params,
            query: req.query,
            headers: req.headers,
          })
        },
      },
    })(req, res, next)
  )

  // parse body params and attache them to req.body
  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(bodyParser.urlencoded({ extended: true }))

  // gzip compression
  app.use(compress())

  // lets you use HTTP verbs such as PUT or DELETE
  // in places where the client doesn't support it
  app.use(methodOverride())

  // secure apps by setting various HTTP headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

  // enable CORS - Cross Origin Resource Sharing
  app.use(cors())

  // enable authentication
  app.use(passport.initialize())
  passport.use('jwt', jwt)

  app.use('/api/v1', routes)

  // if error is not an instanceOf APIError, convert it.
  app.use(ErrorMiddlewares.converter)

  // catch 404 and forward to error handler
  app.use(ErrorMiddlewares.notFound)

  // error handler, send stacktrace only during development
  app.use(ErrorMiddlewares.handler)

  // Connect db
  await mongoose.connect(envs.DATABASE_URL!)

  app.listen(envs.PORT, async () => {
    console.log(`Server is running at http://localhost:${envs.PORT}`)
    logger.info(`Server is running at http://localhost:${envs.PORT}`)
  })
}

main().catch((err) => {
  logger.error(err)
})
