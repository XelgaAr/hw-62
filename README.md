# Зенит · задание 62

«Зенит» — учебный журнал о космосе. Сервер на Express показывает каталог авторов, их профили, список статей и отдельные публикации. Из статьи можно перейти к автору, а из профиля — к его публикациям. Профили и список пользователей рендерит Pug, страницы статей — EJS. Для чтения в браузере достаточно HTML и CSS.

## Запуск в VS Code

Нужен Node.js 24 или новее с npm. Откройте папку `hw-62` через **File → Open Folder**, затем откройте терминал VS Code и выполните:

```sh
npm ci
npm start
```

Откройте [главную страницу](http://localhost:3000/), [авторов](http://localhost:3000/users) или [статьи](http://localhost:3000/articles). После изменений в исходниках можно использовать `npm run dev` для перезапуска сервера. Чтобы завершить работу, нажмите **Ctrl+C**.

Порт по умолчанию — 3000. Для одновременного запуска с другим проектом укажите свободный порт. В PowerShell выполните команды ниже и откройте [http://localhost:3002/](http://localhost:3002/).

```powershell
$env:PORT = "3002"
npm start
```

В Bash используйте `PORT=3002 npm start`.

## Маршруты сервера

| Метод и путь | Результат |
| --- | --- |
| `GET /` | Главная страница. Первая публикация открывает выпуск, остальные представлены карточками. |
| `GET /users` | Список авторов. Шаблон `users/list.pug`. |
| `GET /users/:userId` | Профиль и статьи автора. Шаблон `users/detail.pug`. Пример — `/users/1`. |
| `GET /articles` | Все публикации. Шаблон `articles/list.ejs`. |
| `GET /articles/:articleId` | Текст статьи, автор и источник иллюстрации. Шаблон `articles/detail.ejs`. Пример — `/articles/1`. |
| `GET /assets/…` | Таблица стилей, локальные шрифты и фотографии. |
| `POST /users`, `POST /articles` | Создание записи. Ответ содержит JSON и заголовок `Location`, статус 201. |
| `PUT /users/:userId`, `PUT /articles/:articleId` | Полная замена данных с сохранением ID, ответ 200 с новой записью. |
| `PATCH /users/:userId`, `PATCH /articles/:articleId` | Изменение перечисленных полей, ответ 200 с обновлённой записью. |
| `DELETE /users/:userId`, `DELETE /articles/:articleId` | Удаление записи, ответ 204 с пустым телом. |

ID — положительное целое число. Неизвестная страница или запись получает статус 404. Операции записи принимают `Content-Type: application/json` и открыты для локальной учебной проверки. Данные хранятся в памяти. Перезапуск восстанавливает три начальных профиля и три статьи.

| Ресурс | Обязательные поля при POST и PUT | Дополнительные поля |
| --- | --- | --- |
| Пользователь | `name` | `email`, `role`, `bio` |
| Статья | `title`, `content` | `authorId` — ID существующего пользователя, `summary`, `topic` |

PATCH принимает хотя бы одно поле. Некорректные данные получают статус 400. Чтобы удалить автора с публикациями, сначала укажите другого автора в статьях или удалите его публикации. Пока связь существует, сервер возвращает 409. Источник снимка и его подпись поставляются с редакционными материалами.

Создать статью для проверки можно в PowerShell. После запроса откройте `/articles` в браузере.

```powershell
$body = @{ title = "Первый свет"; content = "Заметка о наблюдении."; authorId = 1 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/articles -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
```

## Проверка и публикация на GitHub Pages

```sh
npm test
npm run build
```

Тесты запускают Express на свободном порту, проверяют HTML и коды ответов, изменения обеих коллекций, пустые состояния и ссылки статической версии. Сборка рендерит те же шаблоны с начальными данными и создаёт девять страниц в `docs/`. Картинки, шрифты и стили входят в сборку, пути работают при любом имени репозитория.

1. Поместите содержимое `hw-62` в корень отдельного репозитория. Папка `docs/` с готовым сайтом уже включена.
2. В **Settings → Pages → Build and deployment** выберите **Deploy from a branch**, вашу ветку и каталог **/docs**. Нажмите **Save**.
3. После публикации откройте адрес сайта в разделе **Pages**. Статьи и профили будут доступны по прямым ссылкам. Правки шаблонов, исходных материалов или CSS включаются в публикацию повторным запуском `npm run build` и обновлением каталога `docs/` в репозитории.

Для локального просмотра готовой статической версии откройте `docs/index.html` через **Open with Live Server** в VS Code. GitHub Pages раздаёт готовые HTML-файлы. Для проверки запросов POST, PUT, PATCH и DELETE запустите Express через `npm start`. Изменения, сделанные через HTTP в работающем сервере, хранятся только до его перезапуска. Данные для следующей статической сборки задаются в `src/models/catalog.mjs`.

## Структура и материалы

- `src/server.mjs` и `src/routes/router.mjs` настраивают Express, шаблоны, раздачу файлов и таблицу маршрутов.
- `src/controllers/` собирает данные для страниц и обрабатывает изменения. `src/models/catalog.mjs` содержит начальные записи и коллекции в памяти.
- `src/views/` содержит представления Pug и EJS. `src/public/` — общие стили, фотографии и шрифты. `scripts/build-pages.mjs` формирует статическую версию.
- Структура маршрутизатора и контроллеров с `res.render` опирается на этап перехода с `node:http` на Express и EJS. Учебный репозиторий использует товары, здесь представлены пользователи и статьи из домашнего задания. [Исходная ветка express-basic-migration, ревизия 50f458f](https://github.com/Alecto/node-http-server-public/tree/50f458faf156c716f9d2213242b3823c1e342772)
- Документация по шаблонизаторам и размещению сайта. [Express](https://expressjs.com/en/guide/using-template-engines.html) · [Pug](https://pugjs.org/api/getting-started.html) · [EJS](https://ejs.co/docs/) · [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- Материалы о Луне, Сатурне и Марсе сопровождаются фотографиями из архивов NASA, подписи и ссылки на первоисточник есть в статьях. [Lunar Near Side](https://science.nasa.gov/resource/lunar-near-side/) · [Bright Slice](https://science.nasa.gov/resource/bright-slice/) · [Olympia Undae](https://science.nasa.gov/photojournal/pj-olympia-undae-34/)
- Локальные шрифты Inter и PT Serif распространяются по SIL Open Font License. Тексты лицензий находятся в `src/public/fonts/`.
