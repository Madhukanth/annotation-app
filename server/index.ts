import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import compress from 'compression'
import methodOverride from 'method-override'
import cors from 'cors'
import helmet from 'helmet'

import envs from './config/vars'
import routes from './routes'
import * as ErrorMiddlewares from './middlewares/error'
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

  // Note: Passport.js removed - using Supabase Auth instead
  // Authentication is handled by the authorize middleware in middlewares/auth.ts

  app.use('/api/v1', routes)

  // if error is not an instanceOf APIError, convert it.
  app.use(ErrorMiddlewares.converter)

  // catch 404 and forward to error handler
  app.use(ErrorMiddlewares.notFound)

  // error handler, send stacktrace only during development
  app.use(ErrorMiddlewares.handler)

  // Note: MongoDB connection removed - using Supabase PostgreSQL instead
  // Supabase client is configured in config/supabase.ts and used directly in services

  app.listen(envs.PORT, async () => {
    console.log(`Server is running at http://localhost:${envs.PORT}`)
    logger.info(`Server is running at http://localhost:${envs.PORT}`)
  })
}

main().catch((err) => {
  logger.error(err)
})
