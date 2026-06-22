
const APP_IDS = {
  // Web
  web:          1,

  // Mobile (Mainstream)
  android:      2,
  ios:          3,

  harmonyos:    4,
  fuchsia:      5,
  tizen:        6,
  watchos:      7,
  wearos:       8,

  // Desktop
  mac:          9,
  windows:      10,
  linux:        11,
  bsd:          12,
  chromeos:     13,

  // Smart TV
  androidtv:    14,
  tvos:         15,
  webos:        16,
  samsungtv:    17,
  roku:         18,
  FireTV:       19,

  embedded:     20,
} as const;

export const APP_ID = APP_IDS[import.meta.env.VITE_PLATFORM as keyof typeof APP_IDS] ?? APP_IDS.web;
