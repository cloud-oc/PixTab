/**
 * Convert manifest.json for Firefox compatibility
 * Firefox does not support service_worker in background, needs scripts array
 */
const fs = require('fs');
const path = require('path');

const manifestPath = path.join(process.cwd(), 'manifest.json');
const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Firefox needs scripts array instead of service_worker
if (m.background && m.background.service_worker) {
    const sw = m.background.service_worker;
    const type = m.background.type;
    m.background = { scripts: [sw] };
    if (type) m.background.type = type;
}

// Firefox prefers single icon string for action.default_icon
if (m.action && m.action.default_icon && typeof m.action.default_icon === 'object') {
    const sizes = ['48', '32', '16', '128'];
    let selected = null;
    for (const s of sizes) {
        if (m.action.default_icon[s]) {
            selected = m.action.default_icon[s];
            break;
        }
    }
    if (!selected) selected = 'icons/icon-48.png';
    m.action.default_icon = selected;
}

// Ensure browser_specific_settings for Firefox
if (!m.browser_specific_settings) m.browser_specific_settings = {};
if (!m.browser_specific_settings.gecko) m.browser_specific_settings.gecko = {};
m.browser_specific_settings.gecko.strict_min_version = '113.0';

if (!m.browser_specific_settings.gecko_android) m.browser_specific_settings.gecko_android = {};
m.browser_specific_settings.gecko_android.strict_min_version = '113.0';

// Data collection permissions for Firefox
m.browser_specific_settings.gecko.data_collection_permissions = 
    m.browser_specific_settings.gecko.data_collection_permissions || 
    { collects: false, required: ['none'], optional: [] };

fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2));
console.log('[OK] Manifest converted for Firefox');
