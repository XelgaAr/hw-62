const missing = (title, section) => ({ view: 'error.ejs', title, section, status: 404 })

export function pages({ users, articles }) {
  const withAuthor = article => ({ ...article, author: users.get(article.authorId) })
  return {
    home() {
      const [feature, ...others] = articles.all().map(withAuthor)
      return { view: 'index.ejs', title: 'Журнал о космосе', section: 'home', feature, others }
    },
    users() {
      return { view: 'users/list.pug', title: 'Авторы', section: 'users', users: users.all() }
    },
    user(id) {
      const user = users.get(id)
      return user ? {
        view: 'users/detail.pug', title: user.name, section: 'users', user,
        articles: articles.all().filter(article => article.authorId === id)
      } : missing('Автор не найден', 'users')
    },
    articles() {
      return { view: 'articles/list.ejs', title: 'Все статьи', section: 'articles', articles: articles.all().map(withAuthor) }
    },
    article(id) {
      const article = articles.get(id)
      return article ? {
        view: 'articles/detail.ejs', title: article.title, section: 'articles', article: withAuthor(article)
      } : missing('Статья не найдена', 'articles')
    }
  }
}
