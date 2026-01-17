# PixTab <img src="icons/icon-128.png" width="36" height="36" align="right" alt="icon">

<a href="https://github.com/cloud-oc/PixTab/blob/main/README.md"><img src="https://img.shields.io/badge/English-blue?style=for-the-badge" alt="English"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_CN.md"><img src="https://img.shields.io/badge/简体中文-red?style=for-the-badge" alt="简体中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.zh_TW.md"><img src="https://img.shields.io/badge/繁體中文-orange?style=for-the-badge" alt="繁體中文"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ja.md"><img src="https://img.shields.io/badge/日本語-green?style=for-the-badge" alt="日本語"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ko.md"><img src="https://img.shields.io/badge/한국어-brightgreen?style=for-the-badge" alt="한국어"></a> <a href="https://github.com/cloud-oc/PixTab/blob/main/README.ru.md"><img src="https://img.shields.io/badge/Русский-purple?style=for-the-badge" alt="Русский"></a>

<a href="https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj"><img src="https://img.shields.io/badge/Edge%20Addons-Install-blueviolet?style=for-the-badge&logo=microsoftedge&logoColor=white" alt="Edge Add-ons"></a> <a href="https://addons.mozilla.org/firefox/addon/pixtab/"><img src="https://img.shields.io/badge/Firefox%20Addons-Install-orange?style=for-the-badge&logo=firefox&logoColor=white" alt="Firefox Add-ons"></a>


## Обзор

PixTab — это лёгкое расширение для браузера, которое отображает работы с Pixiv на странице новой вкладки. Оно поддерживает пользовательские настройки, поиск по ключевым словам, локализацию и работает как в браузерах на базе Chromium, так и Firefox.

## Основные функции

- **Красивые иллюстрации Pixiv** — Наслаждайтесь работами с Pixiv каждый раз при открытии новой вкладки.
- **Несколько режимов сортировки** — Дневной/Недельный/Месячный рейтинг, Новички, Оригиналы, Популярное и другие.
- **Поиск по ключевым словам** — Комбинируйте ключевые слова AND, OR, NOT для фильтрации работ по тегам.
- **Фильтр по закладкам** — Установите диапазон мин./макс. закладок для фильтрации по популярности.
- **Фильтр типа работ** — Выбирайте иллюстрации, мангу, угоира или скройте работы, созданные ИИ.
- **Требования к разрешению** — Установите минимальную ширину/высоту для гарантии качества изображения.
- **Настройка отображения** — Настройте размер изображения, выравнивание и режим мозаики.
- **Светлая и тёмная темы** — Тема интерфейса автоматически переключается в зависимости от системного времени.
- **Мультиязычная поддержка** — Доступен на английском, упрощённом китайском, традиционном китайском, японском, корейском и русском языках.
- **Конфиденциальность** — Все настройки хранятся локально, никакие данные не отправляются на внешние серверы.


## Установка

> **Пользователи Edge могут установить PixTab напрямую из [Microsoft Edge Add-ons Store](https://microsoftedge.microsoft.com/addons/detail/chpabpanagjfnglcpnpdpelacjfpnfoj).**
>
> **Пользователи Firefox могут установить PixTab напрямую из [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/pixtab/).**

> **Примечание**: Это расширение не представлено в Chrome Web Store. Пользователи Chrome, пожалуйста, установите его вручную, следуя инструкциям ниже.

### Браузеры на базе Chromium

1. Клонируйте или скачайте этот репозиторий.
2. Откройте `chrome://extensions` в вашем браузере.
3. Включите **Режим разработчика**.
4. Вариант A — Установка из упакованного ZIP (быстро):
	- Если вы скачали релиз из `dist/` (например `dist/pixtab-0.9-chrome.zip`), некоторые браузеры на базе Chromium позволяют перетащить `.zip` файл на страницу `chrome://extensions` для прямой установки. Если это сработает, расширение будет установлено и готово к использованию.
	- Если перетаскивание не работает для вашего браузера, распакуйте архив и используйте **Загрузить распакованное расширение**, чтобы выбрать извлечённую папку.

5. Вариант B — Установка из исходников (для разработчиков):
	- Нажмите **Загрузить распакованное расширение** и выберите папку проекта.

6. Откройте новую вкладку, чтобы увидеть PixTab в действии!

### Браузеры на базе Firefox (140+)

1. Клонируйте или скачайте этот репозиторий.
2. Используйте Firefox 140 или новее и откройте `about:debugging#/runtime/this-firefox` в браузере.
3. Нажмите **Загрузить временное дополнение...**
4. Вариант A — Установка упакованного XPI (рекомендуется для тестирования):
	- Если вы скачали релиз `dist/*.xpi` (например `dist/pixtab-0.9-firefox.xpi`), откройте `about:addons` и используйте меню шестерёнки → **Установить дополнение из файла...**, или перетащите файл `.xpi` на страницу дополнений для установки.

5. Вариант B — Загрузка временного дополнения (для разработчиков):
	- Нажмите **Загрузить временное дополнение...** и выберите файл `manifest.json` в папке проекта.

6. Откройте новую вкладку, чтобы увидеть PixTab в действии!

> **Примечание**: Временно загруженные расширения в Firefox будут удалены при перезапуске браузера.

## Требования к сети

Это расширение требует доступа к Pixiv (`pixiv.net` и `pximg.net`).

Если страница новой вкладки остаётся на анимации загрузки, это означает, что ваша сеть не может получить доступ к Pixiv. Пожалуйста, решите проблему с сетью самостоятельно. Это расширение не предоставляет никаких прокси-функций.

## Лицензия

Подробности см. в файле [LICENSE](LICENSE).

## Руководство по участию

См. [CONTRIBUTING.md](CONTRIBUTING.md) для получения информации о том, как внести свой вклад.

## Поддержка и пожертвования

Если PixTab оказался вам полезен, вы можете поддержать меня пожертвованием. Каждое ваше поощрение — это моя мотивация двигаться вперёд, я очень благодарен! (╹▽╹)

- [Afdian (爱发电)](https://afdian.com/a/cloud09)
- [Patreon](https://www.patreon.com/cloud09_official)

## Благодарности

Этот проект вдохновлён:

- [HumbleNewTabPage](https://github.com/ibillingsley/HumbleNewTabPage)
- [PixivforMuzei3](https://github.com/yellowbluesky/PixivforMuzei3)
