import express, { Express, Request, Response } from 'express'
import { asyncWrapper, convertMarkdown } from './utils'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'

dotenv.config()

const app: Express = express()
const router = express.Router()
const port = process.env.PORT ?? 8081

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Logging middleware, logs the request method and path for each incoming request
router.use(async function (req, res, next) {
  console.log(`/${req.method}`)
  next()
})

// Liveness probe endpoint for Kubernetes health checks
router.get('/__heartbeat__', (req: Request, res: Response) => {
  res.status(200).send({ status: 'OK' })
})

// Load balancer heartbeat check, useful to detect app readiness
router.get('/__lbheartbeat__', (req: Request, res: Response) => {
  res.status(200).send({ status: 'OK' })
})

router.post('/', asyncWrapper(convertMarkdown))

app.use('/', router)

app.listen(port, () => {
  console.log(`[server]: Server listening on port ${port}`)
})
