export const RankingMode = Object.freeze({
    popularityDaily: "popular_d",
    popularityMaleDaily: "popular_male_d",
    popularityFemaleDaily: "popular_female_d",
    daily: "ranking_daily",
    weekly: "ranking_weekly",
    monthly: "ranking_monthly",
    rookie: "ranking_rookie",
    original: "ranking_original",
    artist: "artist",
    following: "following",
    bookmarks: "bookmarks",
    recommendations: "recommendations"
});

export const ContentFilter = Object.freeze({
    all: "all",
    r18: "r18",
    safe: "safe"
});

export const KeywordStrategy = Object.freeze({
    partial: "s_tag",
    exact: "s_tag_full"
});

export const ArtworkKind = Object.freeze({
    all: "all",
    illustrationAndUgoira: "illust_and_ugoira",
    illustration: "illust",
    manga: "manga",
    ugoira: "ugoira"
});

export const AIGCDisplay = Object.freeze({
    display: "display",
    hide: "hide"
});

export const defaultPreferences = {
    order: RankingMode.daily,
    mode: ContentFilter.safe,
    blt: null,
    bgt: null,
    s_mode: KeywordStrategy.partial,
    type: ArtworkKind.illustrationAndUgoira,
    aiType: AIGCDisplay.hide,
    artistId: "",
    size: "best_fit",
    align: "center",
    tiling: "none",
    minWidthPx: null,
    minHeightPx: null,
    orKeywords: "1000users入り 5000users入り 7500users入り 10000users入り 30000users入り 50000users入り",
    minusKeywords: "虚偽users入りタグ 描き方 講座 作画資料 創作 素材 漫画",
    andKeywords: "",
    debugLogging: false,
    loginFallbackMode: "ranking_daily",
    reverseProxyDomain: ""
};

export { defaultPreferences as defaultConfig };
export { RankingMode as Order, ContentFilter as Mode, KeywordStrategy as SMode, ArtworkKind as ImageType };
