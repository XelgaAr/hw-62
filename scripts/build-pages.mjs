import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from '../src/server.mjs'
import { createCatalog } from '../src/models/catalog.mjs'
import { pages } from '../src/controllers/pages.mjs'

const project = resolve(import.meta.dirname, '..')

export async function buildPages(output = join(project, 'docs')) {
  const catalog = createCatalog()
  const app = createApp(catalog)
  const page = pages(catalog)
  const entries = [
    ['', page.home()], ['users', page.users()], ['articles', page.articles()],
    ...catalog.users.all().map(({ id }) => ['users/' + id, page.user(id)]),
    ...catalog.articles.all().map(({ id }) => ['articles/' + id, page.article(id)])
  ]
  const files = await Promise.all(entries.map(async ([path, model]) => {
    const root = path ? '../'.repeat(path.split('/').length) : './'
    const html = await new Promise((done, fail) =>
      app.render(model.view, { ...model, root }, (err, result) => err ? fail(err) : done(result)))
    return [join(output, path), html.replace(/\r?\n/g, '\r\n')]
  }))
  await rm(output, { force: true, recursive: true })
  await Promise.all(files.map(async ([dir, html]) => {
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'index.html'), html)
  }))
  await cp(join(project, 'src/public'), join(output, 'assets'), { recursive: true })
  await writeFile(join(output, '.nojekyll'), '')
  return files.length
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Создано страниц: ${await buildPages()} (docs/)`)
}
