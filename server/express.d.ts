// Ambient augmentation: the resolveOperator middleware (server/index.ts) attaches the
// resolved tenant id to every request. Always set (demo when anonymous).
import 'express'

declare global {
  namespace Express {
    interface Request {
      operatorId?: string
    }
  }
}
