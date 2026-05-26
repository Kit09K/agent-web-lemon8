// Accounts with full detail (for content generation)
export const ACCOUNTS_DETAIL: {
  id: string;
  label: string;
  username: string;
  url: string;
  avatar: string;
  niche: string;
}[] = [
  {
    id: "acc1",
    label: "@pumppp97",
    username: "@pumppp97",
    url: "https://www.lemon8-app.com/@pumppp97",
    avatar: "https://p16-lemon8-cross-sign.tiktokcdn.com/user-avatar-alisg/ee0a08ee00810715b5e30d066014d58a~tplv-sdweummd6v-shrinkf:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1780315200&x-signature=WNL%2BZ563%2FbJdRVSluPWTMzLGq%2B8%3D",
    niche: "lifestyle",
  },
  {
    id: "acc2",
    label: "@ctrllifee",
    username: "@ctrllifee",
    url: "https://www.lemon8-app.com/@ctrllifee",
    avatar: "https://p16-lemon8-cross-sign.tiktokcdn.com/user-avatar-alisg/e4d0c0e114f12314a77a52844d549e4c~tplv-sdweummd6v-shrinkf:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1780315200&x-signature=%2FEDyLNId6A1QacF%2FxhvpY9SR4XI%3D",
    niche: "beauty",
  },
  {
    id: "acc3",
    label: "@sha_zfleen",
    username: "@sha_zfleen",
    url: "https://www.lemon8-app.com/@sha_zfleen",
    avatar: "https://p19-lemon8-cross-sign.tiktokcdn.com/user-avatar-alisg/facc20fd0570d54c2e293cd3ef79ae4c~tplv-sdweummd6v-shrinkf:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1780315200&x-signature=TU5CqXPqLdP2cKA%2FPkEoqF%2BrI%2Bw%3D",
    niche: "fashion",
  },
  {
    id: "acc4",
    label: "@_babybunny88",
    username: "@_babybunny88",
    url: "https://www.lemon8-app.com/@_babybunny88",
    avatar: "https://p16-lemon8-cross-sign.tiktokcdn.com/user-avatar-alisg/c271ecdfa64bcc09d469b6a46b82e122~tplv-sdweummd6v-shrinkf:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1780315200&x-signature=HZEMVN4LbU2BLLgzn8VjMXIn7QE%3D",
    niche: "food",
  },
  {
    id: "acc5",
    label: "@tofufu11",
    username: "@tofufu11",
    url: "https://www.lemon8-app.com/@tofufu11",
    avatar: "https://p16-lemon8-cross-sign.tiktokcdn.com/user-avatar-alisg/c271ecdfa64bcc09d469b6a46b82e122~tplv-sdweummd6v-shrinkf:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1780315200&x-signature=HZEMVN4LbU2BLLgzn8VjMXIn7QE%3D",
    niche: "travel",
  },
  {
    id: "acc6",
    label: "@winterr597",
    username: "@winterr597",
    url: "https://www.lemon8-app.com/@winterr597",
    avatar: "https://p16-lemon8-cross-sign.tiktokcdn.com/user-avatar-alisg/67558cbb71b623e060ec24baa6b37938~tplv-sdweummd6v-shrinkf:1200:0:q75.webp?lk3s=d32e6450&source=ui_avatar&x-expires=1780315200&x-signature=%2BkS3QENLsPjaiTSMZTYGoNgl2Rg%3D",
    niche: "wellness",
  },
];

// Accounts with display data (for landing page grid)
export const ACCOUNTS = [
  { id: "acc1", label: "@pumppp97",     niche: "lifestyle", emoji: "🌸", gens: 3, verified: true  },
  { id: "acc2", label: "@ctrllifee",    niche: "beauty",    emoji: "💄", gens: 5, verified: true  },
  { id: "acc3", label: "@sha_zfleen",   niche: "fashion",   emoji: "👗", gens: 2, verified: false },
  { id: "acc4", label: "@_babybunny88", niche: "food",      emoji: "🍜", gens: 7, verified: true  },
  { id: "acc5", label: "@tofufu11",     niche: "travel",    emoji: "✈️", gens: 4, verified: false },
  { id: "acc6", label: "@winterr597",   niche: "wellness",  emoji: "🧘", gens: 1, verified: false },
];

export const CONTENT_TYPES = [
  { label: "🔥 Viral Hook", value: "viral_hook" },
  { label: "📖 Story / Experience", value: "story" },
  { label: "📋 List / Tips", value: "list_tips" },
  { label: "🎯 Tutorial / How-to", value: "tutorial" },
  { label: "💬 Opinion / Review", value: "opinion" },
  { label: "✨ Aesthetic / Vibe", value: "aesthetic" },
  { label: "❓ Question / Poll", value: "question" },
  { label: "🆚 Compare / Contrast", value: "compare" },
];

export const POLAROID_DATA = [
  { emoji: "💑",   caption: "Forever Us 💕",  tape: "#ffb3c6", rotate: -4 },
  { emoji: "👯‍♀️", caption: "Best Friends!",  tape: "#b3d9ff", rotate:  3 },
  { emoji: "👰💍", caption: "She Said Yes!",  tape: "#c8f5c8", rotate: -2 },
  { emoji: "🤪",   caption: "Goofballs 😂",   tape: "#ffe4b3", rotate:  5 },
];

export const VIDEO_SCENES = [
  { bg: "linear-gradient(160deg,#ff9a56,#ffad7e,#ffd6a8)", emoji: "💃🕺" },
  { bg: "linear-gradient(160deg,#ff7e8e,#ffa0b0,#ffd6df)", emoji: "💑✨" },
];

export const CORRECT_CODE  = "1234";
export const STORAGE_KEY   = "booth_unlocked";
export const TTL_MS        = 24 * 60 * 60 * 1000;
