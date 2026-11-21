import { Router } from 'express'
import { pages } from '../controllers/pages.mjs'
import { mutate } from '../controllers/mutations.mjs'

export function setupRoutes(app, catalog) {
  const router = Router()
  const page = pages(catalog)
  const show = (res, model) => res.status(model.status ?? 200).render(model.view, model)
  router.get('/', (req, res) => show(res, page.home()))
  for (const [resource, detail] of [['users', 'user'], ['articles', 'article']]) {
    const param = detail + 'Id'
    router.param(param, (req, res, next, value) => {
      if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
        return req.method === 'GET' || req.method === 'HEAD' ? show(res, page[detail](0)) : res.status(404).json({ error: 'Запись не найдена' })
      next()
    })
    const write = mutate(catalog, resource)
    router.route('/' + resource)
      .get((req, res) => show(res, page[resource]()))
      .post(write)
    router.route('/' + resource + '/:' + param)
      .get((req, res) => show(res, page[detail](Number(req.params[param]))))
      .put(write).patch(write).delete(write)
  }
  app.use(router)
}
