
const APP_IDS = {
  // Web & PWA
  web:          1,

  // Mobile (Mainstream)
  android:      2,
  ios:          3,

  // Mobile (Alternative)
  harmonyos:    4, // Huawei Экосистема
  fuchsia:      5, // Google Fuchsia OS
  tizen:        6, // Старые Samsung / Смарт-часы
  watchos:      7, // Apple Watch
  wearos:       8, // Android Wear

  // Desktop
  mac:          9,
  windows:      10,
  linux:        11,
  bsd:          12,
  chromeos:     13, // Google Chromebooks

  // Smart TV & Media
  androidtv:    14,
  tvos:         15, // Apple TV
  webos:        16, // LG Smart TV
  samsungtv:    17, // Новые Samsung TV
  roku:         18, // Roku OS
  FireTV:       19, // Amazon Fire OS

  // Embedded & IoT
  embedded:     20, // Встраиваемые системы / Малины / Микроконтроллеры
} as const;

export const APP_ID = APP_IDS[import.meta.env.VITE_PLATFORM as keyof typeof APP_IDS] ?? APP_IDS.web;
