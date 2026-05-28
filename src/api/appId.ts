
const APP_IDS = {
  web:     1,
  android: 2,
  ios:     3,
} as const;

export const APP_ID = APP_IDS[import.meta.env.VITE_PLATFORM as keyof typeof APP_IDS] ?? APP_IDS.web;