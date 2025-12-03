document.addEventListener('DOMContentLoaded', () => {
    // 多语言翻译数据
    const i18n = {
        zh: {
            description: '每次打开新标签页，都能欣赏来自 Pixiv 的精选插画。<br>支持多种排行榜、关键词搜索、收藏数筛选，打造属于你的壁纸体验。',
            download: '下载扩展',
            viewSource: '查看源码',
            feature1Title: '精选 Pixiv 插画',
            feature1Desc: '支持每日/每周/每月排行榜、新人榜、原创榜、人气榜等多种模式。',
            feature2Title: '高级筛选',
            feature2Desc: '关键词搜索、收藏数范围、作品类型过滤、分辨率要求，精准定制你想要的内容。',
            feature3Title: '明暗主题',
            feature3Desc: '界面主题随系统时间自动切换，白天明亮清爽，夜间深色护眼。',
            feature4Title: '隐私优先',
            feature4Desc: '完全开源，所有设置保存在本地，不向外部服务器发送任何数据。',
            feature5Title: '多语言支持',
            feature5Desc: '提供 English、中文、日本語 三种界面语言。',
            feature6Title: '轻量快速',
            feature6Desc: '无冗余依赖，新标签页秒开，不拖慢你的浏览体验。',
            license: 'Released under MIT License.',
            designed: 'Designed for Chrome & Edge.',
            typeText: '科技 · 纯净 · 陪伴'
        },
        en: {
            description: 'Enjoy beautiful Pixiv artworks every time you open a new tab.<br>Multiple rankings, keyword search, bookmark filtering — create your own wallpaper experience.',
            download: 'Download',
            viewSource: 'View Source',
            feature1Title: 'Curated Pixiv Art',
            feature1Desc: 'Daily, weekly, monthly rankings, rookie, original, popular and more modes.',
            feature2Title: 'Advanced Filtering',
            feature2Desc: 'Keyword search, bookmark range, artwork type, resolution — precisely customize what you want.',
            feature3Title: 'Light & Dark Themes',
            feature3Desc: 'Theme auto-switches with system time — bright during day, dark at night.',
            feature4Title: 'Privacy First',
            feature4Desc: 'Fully open source. All settings stored locally. No data sent to external servers.',
            feature5Title: 'Multi-language',
            feature5Desc: 'Available in English, 中文, and 日本語.',
            feature6Title: 'Lightweight & Fast',
            feature6Desc: 'No bloat. New tabs open instantly without slowing your browsing.',
            license: 'Released under MIT License.',
            designed: 'Designed for Chrome & Edge.',
            typeText: 'Tech · Pure · Companion'
        },
        ja: {
            description: '新しいタブを開くたびに、Pixiv の厳選イラストを楽しめます。<br>多彩なランキング、キーワード検索、ブックマーク数フィルタで、あなただけの壁紙体験を。',
            download: 'ダウンロード',
            viewSource: 'ソースを見る',
            feature1Title: '厳選 Pixiv イラスト',
            feature1Desc: 'デイリー/ウィークリー/マンスリーランキング、ルーキー、オリジナル、人気順など多彩なモード。',
            feature2Title: '高度なフィルタリング',
            feature2Desc: 'キーワード検索、ブックマーク数範囲、作品タイプ、解像度 — 欲しいコンテンツを精密にカスタマイズ。',
            feature3Title: 'ライト & ダークテーマ',
            feature3Desc: 'システム時間に合わせてテーマが自動切り替え。昼は明るく、夜は目に優しいダークモード。',
            feature4Title: 'プライバシー重視',
            feature4Desc: '完全オープンソース。設定はすべてローカル保存。外部サーバーへのデータ送信なし。',
            feature5Title: '多言語対応',
            feature5Desc: 'English、中文、日本語 に対応。',
            feature6Title: '軽量 & 高速',
            feature6Desc: '無駄な依存なし。新しいタブが瞬時に開き、ブラウジングを遅くしません。',
            license: 'MIT License で公開。',
            designed: 'Chrome & Edge 向けにデザイン。',
            typeText: 'テクノロジー · ピュア · コンパニオン'
        }
    };

    let currentLang = 'zh';

    // 翻译函数
    function applyTranslation(lang) {
        currentLang = lang;
        const translations = i18n[lang];
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key]) {
                el.innerHTML = translations[key];
            }
        });

        // 更新按钮状态
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        // 重新启动打字机效果
        startTyping(translations.typeText);
        
        // 保存语言偏好
        localStorage.setItem('pixtab-lang', lang);
    }

    // 语言切换按钮事件
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyTranslation(btn.dataset.lang);
        });
    });

    // 打字机效果
    const subtitleElement = document.querySelector('.subtitle');
    const cursor = '<span id="typing-cursor">|</span>';
    let typeTimer = null;

    function startTyping(text) {
        // 清除之前的定时器
        if (typeTimer) {
            clearTimeout(typeTimer);
        }
        
        let index = 0;
        let txt = '';
        subtitleElement.innerHTML = cursor;

        function type() {
            if (index < text.length) {
                txt += text.charAt(index);
                subtitleElement.innerHTML = txt + cursor;
                index++;
                typeTimer = setTimeout(type, 150);
            }
        }

        typeTimer = setTimeout(type, 300);
    }

    // 光标闪烁
    setInterval(() => {
        const cursorEl = document.getElementById('typing-cursor');
        if (cursorEl) {
            cursorEl.style.opacity = cursorEl.style.opacity === '0' ? '1' : '0';
        }
    }, 500);

    // 初始化：检查本地存储的语言偏好
    const savedLang = localStorage.getItem('pixtab-lang') || 'zh';
    applyTranslation(savedLang);
});