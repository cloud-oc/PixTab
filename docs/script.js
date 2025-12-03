document.addEventListener('DOMContentLoaded', () => {
    // 打字机效果配置
    const textToType = "科技 · 纯净 · 陪伴";
    const element = document.querySelector('.subtitle');
    // 保留原始的 | 光标
    const cursor = '<span id="typing-cursor">|</span>';
    
    let index = 0;
    let isDeleting = false;
    let txt = '';
    
    // 清空初始文本，只留光标
    element.innerHTML = cursor;

    function type() {
        // 这里只是简单的模拟一次性打字效果，如需循环可修改
        if (index < textToType.length) {
            txt += textToType.charAt(index);
            element.innerHTML = txt + cursor;
            index++;
            setTimeout(type, 150); // 打字速度
        }
    }

    // 延迟 500ms 后开始打字
    setTimeout(type, 500);

    // 简单的光标闪烁
    setInterval(() => {
        const cursorEl = document.getElementById('typing-cursor');
        if(cursorEl) {
            cursorEl.style.opacity = cursorEl.style.opacity === '0' ? '1' : '0';
        }
    }, 500);
});