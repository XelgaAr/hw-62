import express from 'express'
import { join } from 'node:path'
import { createCatalog } from './models/catalog.mjs'
import { setupRoutes } from './routes/router.mjs'

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export function createApp(catalog = createCatalog()) {
  const app = express()
  app.disable('x-powered-by')
  app.set('view engine', 'ejs')
  app.set('views', join(import.meta.dirname, 'views'))
  Object.assign(app.locals, {
    root: '/',
    dateLabel: iso => dateFormat.format(new Date(iso)),
    initials: name => name.split(/\s+/u).slice(0, 2).map(part => [...part][0]).join('')
  })
  app.use('/assets', express.static(join(import.meta.dirname, 'public')))
  app.use(express.json({ limit: '64kb' }))
  setupRoutes(app, catalog)
  app.use((req, res, next) => next(Object.assign(new Error('Страница не найдена'), { status: 404 })))
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    const status = err.status ?? 500
    const title = status === 500 ? 'Ошибка сервера' : err.type === 'entity.parse.failed' ? 'Некорректный JSON' : err.message
    res.status(status)
    if (req.method === 'GET' || req.method === 'HEAD')
      return res.render('error.ejs', { title, status, section: '' })
    res.json({ error: title })
  })
  return app
}
