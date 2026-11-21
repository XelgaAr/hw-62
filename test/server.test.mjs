import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createApp } from '../src/server.mjs'

describe('Публичные страницы и изменения каталога', { concurrency: false }, () => {
  let server, origin
  const request = (path, method = 'GET', body) => fetch(origin + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  before(async () => {
    server = createApp().listen(0, '127.0.0.1')
    await once(server, 'listening')
    origin = 'http://127.0.0.1:' + server.address().port
  })
  after(() => new Promise(done => server.close(done)))

  for (const [path, title] of [
    ['/', 'Два цвета Луны'], ['/users', 'Авторы'], ['/users/1', 'София Левина'],
    ['/articles', 'Все статьи'], ['/articles/1', 'Два цвета Луны']
  ]) {
    it('Выдаёт готовую HTML-страницу ' + path, async () => {
      const res = await request(path)
      assert.equal(res.status, 200)
      assert.match(res.headers.get('Content-Type'), /text\/html/)
      assert.match(await res.text(), new RegExp('<h1>' + title + '</h1>'))
    })
  }

  it('Связывает карточку автора со статьёй в обе стороны', async () => {
    const author = await (await request('/users/2')).text()
    const article = await (await request('/articles/2')).text()
    assert.match(author, /href="\/articles\/2\/"/)
    assert.match(article, /href="\/users\/2\/"/)
  })
  it('Отдаёт локальные стили и снимок с правильным MIME', async () => {
    for (const [path, mime] of [['site.css', 'text/css'], ['media/moon.webp', 'image/webp']]) {
      const res = await request('/assets/' + path)
      assert.equal(res.status, 200)
      assert.ok(res.headers.get('Content-Type').startsWith(mime))
    }
  })
  it('Возвращает 404 для неизвестных маршрутов, карточек и неверных ID', async () => {
    for (const path of ['/missing', '/users/999', '/articles/999', '/articles/0x1', '/users/1e0', '/users/0']) {
      const res = await request(path)
      assert.equal(res.status, 404, path)
      assert.match(await res.text(), /Ошибка 404/)
    }
  })
  it('Создаёт, изменяет и удаляет связанные записи', async () => {
    const author = await request('/users', 'POST', { name: 'Роман <Орлов>' })
    assert.equal(author.status, 201)
    const authorUrl = author.headers.get('Location')
    const { id } = await author.json()
    const created = await request('/articles', 'POST', { title: 'Обзор <Луны>', content: 'Текст', authorId: id })
    assert.equal(created.status, 201)
    const articleUrl = created.headers.get('Location')
    assert.match(await (await request(authorUrl)).text(), /Роман &lt;Орлов&gt;/)
    assert.match(await (await request(articleUrl)).text(), /Обзор &lt;Луны&gt;/)
    assert.equal((await request(authorUrl, 'DELETE')).status, 409)
    assert.equal((await request(articleUrl, 'PATCH', { summary: 'Новые наблюдения' })).status, 200)
    assert.match(await (await request(articleUrl)).text(), /Новые наблюдения/)
    assert.equal((await request(articleUrl, 'PUT', { title: 'Без автора', content: 'Новый текст' })).status, 200)
    assert.doesNotMatch(await (await request(articleUrl)).text(), /Новые наблюдения/)
    assert.equal((await request(authorUrl, 'PATCH', { role: 'Редактор' })).status, 200)
    assert.match(await (await request(authorUrl)).text(), /Редактор/)
    assert.equal((await request(authorUrl, 'PUT', { name: 'Новый автор' })).status, 200)
    assert.equal((await request(authorUrl, 'DELETE')).status, 204)
    assert.equal((await request(articleUrl, 'DELETE')).status, 204)
    assert.equal((await request(articleUrl)).status, 404)
  })
  it('Отклоняет ошибочные данные и ссылки на отсутствующего автора', async () => {
    for (const [path, body] of [
      ['/users', { name: '  ' }], ['/users', { name: 'Марк', email: 'mail' }],
      ['/articles', { title: 'Тест', content: 'Текст', authorId: 9999 }], ['/articles', { title: 'Тест' }],
      ['/articles', { title: 'Тест', content: 'Текст', image: 'user-supplied' }]
    ])
      assert.equal((await request(path, 'POST', body)).status, 400)
    assert.equal((await request('/articles/0x1', 'DELETE')).status, 404)
    assert.equal((await request('/articles/999', 'PATCH', { title: 'Тест' })).status, 404)
    const invalid = await fetch(origin + '/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })
    assert.equal(invalid.status, 400)
    assert.equal((await invalid.json()).error, 'Некорректный JSON')
  })
  it('Отображает пустой журнал, список авторов и заново созданную статью', async () => {
    for (const resource of ['articles', 'users'])
      for (const id of [1, 2, 3])
        assert.equal((await request('/' + resource + '/' + id, 'DELETE')).status, 204)
    assert.match(await (await request('/')).text(), /Публикаций пока нет/)
    assert.match(await (await request('/articles')).text(), /Публикаций пока нет/)
    assert.match(await (await request('/users')).text(), /пока нет авторов/)
    const article = await request('/articles', 'POST', { title: 'Первый свет', content: 'О наблюдениях' })
    assert.equal(article.status, 201)
    assert.match(await (await request('/')).text(), /Первый свет/)
    assert.match(await (await request(article.headers.get('Location'))).text(), /О наблюдениях/)
  })
})
