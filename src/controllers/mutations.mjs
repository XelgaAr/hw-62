const fail = (status, message) => Object.assign(new Error(message), { status })

export function mutate(catalog, resource) {
  const records = catalog[resource]
  const isUser = resource === 'users'
  const keys = isUser ? ['name', 'email', 'role', 'bio'] : ['title', 'content', 'authorId', 'summary', 'topic']
  return (req, res) => {
    const isNew = req.method === 'POST'
    const id = isNew ? undefined : Number(req.params.userId ?? req.params.articleId)
    const current = records.get(id)
    if (!isNew && !current)
      throw fail(404, 'Запись не найдена')
    if (req.method === 'DELETE') {
      if (isUser && catalog.articles.all().some(article => article.authorId === id))
        throw fail(409, 'У автора есть статьи')
      records.delete(id)
      return res.sendStatus(204)
    }
    const body = req.body
    if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length ||
      Object.keys(body).some(key => !keys.includes(key)))
      throw fail(400, 'Проверьте поля запроса')
    const data = req.method === 'PATCH' ? { ...current } : {}
    for (const [key, value] of Object.entries(body)) {
      if (key === 'authorId') {
        if (!Number.isSafeInteger(value) || !catalog.users.get(value))
          throw fail(400, 'Укажите ID существующего автора')
        data.authorId = value
      } else {
        if (typeof value !== 'string' || !value.trim())
          throw fail(400, 'Текстовые поля должны содержать непустую строку')
        data[key] = value.trim()
      }
    }
    if (isUser ? !data.name : !data.title || !data.content)
      throw fail(400, isUser ? 'Требуется name' : 'Требуются title и content')
    if (isUser && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      throw fail(400, 'Проверьте адрес электронной почты')
    const row = records.save(data, id)
    if (isNew) res.location(`/${resource}/${row.id}`)
    res.status(isNew ? 201 : 200).json(row)
  }
}
