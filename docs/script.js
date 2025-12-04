document.addEventListener('DOMContentLoaded', () => {
    // 粒子背景 - 游戏主界面风格
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 40;

    // 统一的飘动方向（略微向右上飘）
    const windX = 0.3;
    const windY = -0.2;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor(init = false) {
            this.reset(init);
        }

        reset(init = false) {
            // 初始化时随机分布，之后从底部或左侧进入
            if (init) {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
            } else {
                // 从底部或右侧重新进入
                if (Math.random() > 0.5) {
                    this.x = Math.random() * canvas.width;
                    this.y = canvas.height + 10;
                } else {
                    this.x = -10;
                    this.y = Math.random() * canvas.height;
                }
            }

            // 大小在 1-4px 之间随机
            this.size = Math.random() * 3 + 1;

            // 基础速度 + 随机扰动
            this.speedX = windX + (Math.random() - 0.5) * 0.2;
            this.speedY = windY + (Math.random() - 0.5) * 0.2;

            // 透明度在 0.1-0.6 之间随机
            this.opacity = Math.random() * 0.5 + 0.1;

            // 轻微的闪烁效果
            this.flickerSpeed = Math.random() * 0.02 + 0.005;
            this.flickerOffset = Math.random() * Math.PI * 2;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // 闪烁效果
            this.flickerOffset += this.flickerSpeed;

            // 超出边界后重置
            if (this.x > canvas.width + 10 || this.y < -10) {
                this.reset(false);
            }
        }

        draw() {
            const isLight = document.body.classList.contains('light-theme');
            const baseColor = isLight ? '0, 0, 0' : '255, 255, 255';

            // 闪烁透明度
            const flicker = Math.sin(this.flickerOffset) * 0.15;
            const finalOpacity = Math.max(0.05, Math.min(0.7, this.opacity + flicker));

            ctx.fillStyle = `rgba(${baseColor}, ${finalOpacity})`;
            ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }
    }

    // 初始化粒子
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(true));
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });

        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // 自定义光标
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    let mouseX = 0, mouseY = 0;
    let outlineX = 0, outlineY = 0;

    // 鼠标移动时更新光标位置
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // 圆点立即跟随
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
    });

    // 正方形外框平滑跟随
    function animateOutline() {
        outlineX += (mouseX - outlineX) * 0.15;
        outlineY += (mouseY - outlineY) * 0.15;

        cursorOutline.style.left = outlineX + 'px';
        cursorOutline.style.top = outlineY + 'px';

        requestAnimationFrame(animateOutline);
    }
    animateOutline();

    // 点击时旋转
    document.addEventListener('mousedown', () => {
        cursorOutline.classList.add('clicking');
    });

    document.addEventListener('mouseup', () => {
        setTimeout(() => {
            cursorOutline.classList.remove('clicking');
        }, 400);
    });

    // 悬停在可点击元素上时放大
    const clickableElements = document.querySelectorAll('a, button, [role="button"], input, select, textarea');
    clickableElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.classList.add('hovering');
            cursorOutline.classList.add('hovering');
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('hovering');
            cursorOutline.classList.remove('hovering');
        });
    });

    // 鼠标离开窗口时隐藏光标
    document.addEventListener('mouseleave', () => {
        cursorDot.style.opacity = '0';
        cursorOutline.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        cursorDot.style.opacity = '1';
        cursorOutline.style.opacity = '1';
    });

    // 隐藏加载动画
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 800);

    // 获取 GitHub 最新版本号（包括 Pre-release）
    const versionBadge = document.getElementById('versionBadge');
    fetch('https://api.github.com/repos/cloud-oc/PixTab/releases')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0 && data[0].tag_name) {
                versionBadge.textContent = data[0].tag_name;
            } else {
                versionBadge.textContent = 'v1.0.0';
            }
        })
        .catch(() => {
            versionBadge.textContent = 'v1.0.0';
        });

    // 多语言翻译数据
    const i18n = {
        zh: {
            description: '每次打开新标签页，都能欣赏来自 Pixiv 的精选插画。<br>支持多种排行榜、关键词搜索、收藏数筛选，打造属于你的壁纸体验。',
            download: '下载',
            license: 'Released under Apache-2.0 License.',
            designed: 'Designed for modern browsers.',
            typeText: '让 Pixiv 上的插画成为你的浏览器新标签页'
        },
        en: {
            description: 'Enjoy beautiful Pixiv artworks every time you open a new tab.<br>Multiple rankings, keyword search, bookmark filtering — create your own wallpaper experience.',
            download: 'Download',
            license: 'Released under Apache-2.0 License.',
            designed: 'Designed for modern browsers.',
            typeText: "Pixiv illustrations as your browser's new tab page"
        },
        ja: {
            description: '新しいタブを開くたびに、Pixiv の厳選イラストを楽しめます。<br>多彩なランキング、キーワード検索、ブックマーク数フィルタで、あなただけの壁紙体験を。',
            download: 'ダウンロード',
            license: 'Apache-2.0 License で公開。',
            designed: 'モダンブラウザ向けにデザイン。',
            typeText: 'Pixiv のイラストをブラウザの新しいタブページに'
        }
    };

    // 语言显示名称映射
    const langNames = {
        zh: '中文',
        en: 'English',
        ja: '日本語'
    };

    let currentLang = 'zh';
    const langCurrent = document.getElementById('langCurrent');

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

        // 更新下拉框当前语言显示
        if (langCurrent) {
            langCurrent.textContent = langNames[lang];
        }

        // 更新选项激活状态
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });

        // 重新启动打字机效果
        startTyping(translations.typeText);

        // 保存语言偏好
        localStorage.setItem('pixtab-lang', lang);
    }

    // 语言切换事件
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => {
            applyTranslation(opt.dataset.lang);
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

    // 初始化：检查浏览器语言偏好，然后检查本地存储
    function getDefaultLang() {
        const savedLang = localStorage.getItem('pixtab-lang');
        if (savedLang && i18n[savedLang]) {
            return savedLang;
        }
        // 检测浏览器语言
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.startsWith('zh')) {
            return 'zh';
        } else if (browserLang.startsWith('ja')) {
            return 'ja';
        } else {
            return 'en';
        }
    }
    applyTranslation(getDefaultLang());

    // 主题切换功能
    const themeToggle = document.getElementById('themeToggle');

    function setTheme(isDark) {
        if (isDark) {
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
        }
        localStorage.setItem('pixtab-theme', isDark ? 'dark' : 'light');
    }

    // 初始化主题
    const savedTheme = localStorage.getItem('pixtab-theme');
    if (savedTheme === 'light') {
        setTheme(false);
    } else {
        setTheme(true);
    }

    // 主题切换按钮事件
    themeToggle.addEventListener('click', () => {
        const isDark = !document.body.classList.contains('light-theme');
        setTheme(!isDark);
    });

    // 检测 Pixiv 连接状态（更可靠的实现：使用 Image 的 onload/onerror）
    const pixivStatus = document.getElementById('pixivStatus');
    async function checkPixivConnection() {
        if (!pixivStatus) return;
        pixivStatus.textContent = 'CHECKING';
        pixivStatus.className = 'status-checking';

        return new Promise((resolve) => {
            const img = new Image();
            let settled = false;
            const timeout = setTimeout(() => {
                if (settled) return;
                settled = true;
                pixivStatus.textContent = 'OFFLINE';
                pixivStatus.className = 'status-offline';
                resolve(false);
            }, 5000);

            img.onload = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                pixivStatus.textContent = 'ONLINE';
                pixivStatus.className = 'status-online';
                resolve(true);
            };

            img.onerror = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                pixivStatus.textContent = 'OFFLINE';
                pixivStatus.className = 'status-offline';
                resolve(false);
            };

            // 通过请求 Pixiv 的 favicon 来检测连通性，追加时间戳以避免缓存
            try {
                img.src = 'https://www.pixiv.net/favicon.ico?cache=' + Date.now();
            } catch (e) {
                clearTimeout(timeout);
                pixivStatus.textContent = 'OFFLINE';
                pixivStatus.className = 'status-offline';
                resolve(false);
            }
        });
    }
    checkPixivConnection();

    // Chromium 检测已移除：不再显示特定浏览器内核信息
});