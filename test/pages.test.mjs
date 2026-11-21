import { it } from 'node:test'
import assert from 'node:assert/strict'
import { access, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildPages } from '../scripts/build-pages.mjs'

it('Сборка создаёт все страницы и рабочие ссылки под произвольным префиксом', async () => {
  const out = await mkdtemp(join(tmpdir(), 'zenit-test-'))
  try {
    assert.equal(await buildPages(out), 9)
    const paths = ['', 'users/', 'articles/', ...[1, 2, 3].flatMap(id => ['users/' + id + '/', 'articles/' + id + '/'])]
    for (const path of paths) {
      const html = await readFile(join(out, path, 'index.html'), 'utf8')
      for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        if (/^(?:https:|mailto:|#)/.test(url)) continue
        const actual = new URL(url, 'https://example.org/my-repo/' + path)
        assert.ok(actual.pathname.startsWith('/my-repo/'), path + ' → ' + url)
        const file = actual.pathname.slice('/my-repo/'.length) + (actual.pathname.endsWith('/') ? 'index.html' : '')
        await access(join(out, file))
      }
    }
    const css = await readFile(join(out, 'assets/site.css'), 'utf8')
    for (const [, url] of css.matchAll(/url\("([^"]+)"\)/g))
      await access(join(out, 'assets', url))
    await access(join(out, '.nojekyll'))
  } finally {
    await rm(out, { recursive: true, force: true })
  }
})
