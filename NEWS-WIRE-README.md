# Deep-Sync News Wire — автообновляемый виджет

Три файла + один секрет — и виджет сам обновляется по расписанию через GitHub Actions,
без Claude Desktop и без ручных публикаций.

## Как это работает

1. `.github/workflows/update-news.yml` — раз в день (или чаще/реже, меняешь в cron)
   GitHub сам запускает джобу.
2. Джоба вызывает `scripts/generate-news.mjs`, который дергает Claude API
   (с включённым web-поиском) и просит собрать свежие новости по EU funding /
   deep tech, отдать их строго в JSON.
3. Результат сохраняется в `data/news.json` и коммитится обратно в репозиторий.
4. На сайте `widget/deepsync-news-widget.js` просто подтягивает этот JSON
   и рисует карточки — без React, без сборки, чистый JS.

## Установка (5 шагов)

1. **Скопируй файлы в свой репозиторий**, сохранив структуру:
   ```
   .github/workflows/update-news.yml
   scripts/generate-news.mjs
   data/news.json          (стартовый файл-заглушка, Action его перезапишет)
   widget/deepsync-news-widget.js
   ```

2. **Заведи API-ключ**, если ещё нет: console.anthropic.com → Settings → API Keys.
   (Это платный API-доступ, отдельный от твоей подписки в чате — счёт идёт по токенам,
   при одном запросе в день расход минимальный.)

3. **Добавь ключ как секрет репозитория**:
   Settings → Secrets and variables → Actions → New repository secret
   Имя: `ANTHROPIC_API_KEY`, значение — сам ключ.

4. **Вставь виджет на нужную страницу сайта** (например, index.html или страницу
   Insights Hub):
   ```html
   <div id="deepsync-news-wire"></div>
   <script src="/widget/deepsync-news-widget.js"></script>
   ```
   Если `data/news.json` лежит не в корне сайта, укажи путь явно:
   ```html
   <div id="deepsync-news-wire" data-src="/path/to/data/news.json"></div>
   ```

5. **Запусти вручную первый раз**, не дожидаясь расписания:
   вкладка Actions → "Update Deep-Sync News Wire" → Run workflow.
   Дальше он будет срабатывать сам по cron.

## Что можно подкрутить

- **Частота**: строка `cron: "0 6 * * *"` в workflow — сейчас раз в день в 06:00 UTC.
- **Темы/категории**: список в `SYSTEM_PROMPT` внутри `generate-news.mjs`
  (сейчас AI ACT / EIC / DIGITAL EUROPE / EIT / DEEP TECH / HORIZON EUROPE).
- **Модель**: `"model": "claude-sonnet-5"` в том же файле — можно заменить на
  более дешёвую, если качество устроит.
- **Оформление виджета**: вся CSS — в начале `deepsync-news-widget.js`,
  один блок `style.textContent`.
