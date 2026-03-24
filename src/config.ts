interface AppConfig {
  APP_NAME: string;
  TELEGRAM_BOT_NAME: string;
  TELEGRAM_BOT_AUTH_ENABLE: string;
  TELEGRAM_BOT_AUTH_PROFILE: string;
  TELEGRAM_WEBAPP_AUTH_ENABLE: string;
  TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE: string;
  TELEGRAM_WEBAPP_PROFILE: string;
  SUPPORT_LINK: string;
  DEFAULT_LANGUAGE: string;
  SHM_BASE_PATH: string;
  OTP_ENABLE: string;
  PASSKEY_ENABLE: string;
  PASSKEY_AUTH_DISABLED: string;
  BITRIX_WIDGET_SCRIPT_URL: string;
  PROXY_CATEGORY: string;
  PROXY_CATEGORY_TITLE: string;
  PROXY_STORAGE_PREFIX?: string;
  VPN_CATEGORY: string;
  VPN_CATEGORY_TITLE: string;
  VPN_STORAGE_PREFIX?: string;
  VISIBLE_CATEGORIES: string;
  EMAIL_REQUIRED: string;
  EMAIL_VERIFY_REQUIRED: string;
  ALLOW_SERVICE_BLOCKED: string;
  ALLOW_SERVICE_DELETE: string;
  ALLOW_SERVICE_CHANGE: string;
  ALLOW_SERVICE_CHANGE_FORCE: string;
  SERVICE_CHANGE_ALL_CATEGORY: string;
  ALLOW_TELEGRAM_PIN: string;
  VPN_APP_WINDOWS_URL: string;
  VPN_APP_LINUX_URL: string;
  VPN_APP_MAC_URL: string;
  VPN_APP_IOS_URL: string;
  VPN_APP_ANDROID_URL: string;
  PROXY_APP_WINDOWS_URL: string;
  PROXY_APP_LINUX_URL: string;
  PROXY_APP_MAC_URL: string;
  PROXY_APP_IOS_URL: string;
  PROXY_APP_ANDROID_URL: string;
  VPN_WINDOWS_APP_NAME: string;
  VPN_LINUX_APP_NAME: string;
  VPN_MAC_APP_NAME: string;
  VPN_IOS_APP_NAME: string;
  VPN_ANDROID_APP_NAME: string;
  PROXY_WINDOWS_APP_NAME: string;
  PROXY_LINUX_APP_NAME: string;
  PROXY_MAC_APP_NAME: string;
  PROXY_IOS_APP_NAME: string;
  PROXY_ANDROID_APP_NAME: string;
  APPLE_TV_APP_NAME: string;
  ANDROID_TV_APP_NAME: string;
  WINDOWS_PROXY_URL_SCHEMA: string;
  LINUX_PROXY_URL_SCHEMA: string;
  MAC_PROXY_URL_SCHEMA: string;
  IOS_PROXY_URL_SCHEMA: string;
  ANDROID_PROXY_URL_SCHEMA: string;
  CAPTCHA_ENABLED: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;
  }
}

function getConfig(): AppConfig {
  const runtimeConfig = window.__APP_CONFIG__;

  return {
    APP_NAME: runtimeConfig?.APP_NAME || import.meta.env.VITE_APP_NAME || 'SHM Client',
    TELEGRAM_BOT_NAME: runtimeConfig?.TELEGRAM_BOT_NAME || import.meta.env.VITE_TELEGRAM_BOT_NAME || '',
    TELEGRAM_BOT_AUTH_ENABLE: runtimeConfig?.TELEGRAM_BOT_AUTH_ENABLE || import.meta.env.VITE_TELEGRAM_BOT_AUTH_ENABLE || 'false',
    TELEGRAM_BOT_AUTH_PROFILE: runtimeConfig?.TELEGRAM_BOT_AUTH_PROFILE || import.meta.env.VITE_TELEGRAM_BOT_AUTH_PROFILE || 'telegram_bot',
    TELEGRAM_WEBAPP_AUTH_ENABLE: runtimeConfig?.TELEGRAM_WEBAPP_AUTH_ENABLE || import.meta.env.VITE_TELEGRAM_WEBAPP_AUTH_ENABLE || 'false',
    TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE: runtimeConfig?.TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE || import.meta.env.VITE_TELEGRAM_WEBAPP_AUTO_AUTH_ENABLE || 'false',
    TELEGRAM_WEBAPP_PROFILE: runtimeConfig?.TELEGRAM_WEBAPP_PROFILE || import.meta.env.VITE_TELEGRAM_WEBAPP_PROFILE || '',
    SUPPORT_LINK: runtimeConfig?.SUPPORT_LINK || import.meta.env.VITE_SUPPORT_LINK || '',
    DEFAULT_LANGUAGE: runtimeConfig?.DEFAULT_LANGUAGE || import.meta.env.VITE_DEFAULT_LANGUAGE || 'ru',
    SHM_BASE_PATH: runtimeConfig?.SHM_BASE_PATH || import.meta.env.VITE_SHM_BASE_PATH || '/',
    OTP_ENABLE: runtimeConfig?.OTP_ENABLE || import.meta.env.VITE_OTP_ENABLE || 'true',
    PASSKEY_ENABLE: runtimeConfig?.PASSKEY_ENABLE || import.meta.env.VITE_PASSKEY_ENABLE || 'true',
    PASSKEY_AUTH_DISABLED: runtimeConfig?.PASSKEY_AUTH_DISABLED || import.meta.env.VITE_PASSKEY_AUTH_DISABLED || 'false',
    BITRIX_WIDGET_SCRIPT_URL: runtimeConfig?.BITRIX_WIDGET_SCRIPT_URL || import.meta.env.VITE_BITRIX_WIDGET_SCRIPT_URL || '',
    PROXY_CATEGORY: runtimeConfig?.PROXY_CATEGORY || import.meta.env.VITE_PROXY_CATEGORY || '',
    PROXY_CATEGORY_TITLE: runtimeConfig?.PROXY_CATEGORY_TITLE || import.meta.env.VITE_PROXY_CATEGORY_TITLE || '',
    PROXY_STORAGE_PREFIX: runtimeConfig?.PROXY_STORAGE_PREFIX || import.meta.env.VITE_PROXY_STORAGE_PREFIX || '',
    VPN_CATEGORY: runtimeConfig?.VPN_CATEGORY || import.meta.env.VITE_VPN_CATEGORY || '',
    VPN_CATEGORY_TITLE: runtimeConfig?.VPN_CATEGORY_TITLE || import.meta.env.VITE_VPN_CATEGORY_TITLE|| '',
    VPN_STORAGE_PREFIX: runtimeConfig?.VPN_STORAGE_PREFIX || import.meta.env.VITE_VPN_STORAGE_PREFIX || '',
    VISIBLE_CATEGORIES: runtimeConfig?.VISIBLE_CATEGORIES || import.meta.env.VITE_VISIBLE_CATEGORIES || '',
    EMAIL_REQUIRED: runtimeConfig?.EMAIL_REQUIRED || import.meta.env.VITE_EMAIL_REQUIRED || 'true',
    EMAIL_VERIFY_REQUIRED: runtimeConfig?.EMAIL_VERIFY_REQUIRED || import.meta.env.VITE_EMAIL_VERIFY_REQUIRED || 'false',
    ALLOW_SERVICE_BLOCKED: runtimeConfig?.ALLOW_SERVICE_BLOCKED || import.meta.env.VITE_ALLOW_SERVICE_BLOCKED || 'true',
    ALLOW_SERVICE_DELETE: runtimeConfig?.ALLOW_SERVICE_DELETE || import.meta.env.VITE_ALLOW_SERVICE_DELETE || 'true',
    ALLOW_SERVICE_CHANGE: runtimeConfig?.ALLOW_SERVICE_CHANGE || import.meta.env.VITE_ALLOW_SERVICE_CHANGE || 'true',
    ALLOW_SERVICE_CHANGE_FORCE: runtimeConfig?.ALLOW_SERVICE_CHANGE_FORCE || import.meta.env.VITE_ALLOW_SERVICE_CHANGE_FORCE || 'false',
    SERVICE_CHANGE_ALL_CATEGORY: runtimeConfig?.SERVICE_CHANGE_ALL_CATEGORY || import.meta.env.VITE_SERVICE_CHANGE_ALL_CATEGORY || 'true',
    ALLOW_TELEGRAM_PIN: runtimeConfig?.ALLOW_TELEGRAM_PIN || import.meta.env.VITE_ALLOW_TELEGRAM_PIN || 'false',
    VPN_APP_WINDOWS_URL: runtimeConfig?.VPN_APP_WINDOWS_URL || import.meta.env.VITE_VPN_APP_WINDOWS_URL || '',
    VPN_APP_LINUX_URL: runtimeConfig?.VPN_APP_LINUX_URL || import.meta.env.VITE_VPN_APP_LINUX_URL || '',
    VPN_APP_MAC_URL: runtimeConfig?.VPN_APP_MAC_URL || import.meta.env.VITE_VPN_APP_MAC_URL || '',
    VPN_APP_IOS_URL: runtimeConfig?.VPN_APP_IOS_URL || import.meta.env.VITE_VPN_APP_IOS_URL || '',
    VPN_APP_ANDROID_URL: runtimeConfig?.VPN_APP_ANDROID_URL || import.meta.env.VITE_VPN_APP_ANDROID_URL || '',
    PROXY_APP_WINDOWS_URL: runtimeConfig?.PROXY_APP_WINDOWS_URL || import.meta.env.VITE_PROXY_APP_WINDOWS_URL || '',
    PROXY_APP_LINUX_URL: runtimeConfig?.PROXY_APP_LINUX_URL || import.meta.env.VITE_PROXY_APP_LINUX_URL || '',
    PROXY_APP_MAC_URL: runtimeConfig?.PROXY_APP_MAC_URL || import.meta.env.VITE_PROXY_APP_MAC_URL || '',
    PROXY_APP_IOS_URL: runtimeConfig?.PROXY_APP_IOS_URL || import.meta.env.VITE_PROXY_APP_IOS_URL || '',
    PROXY_APP_ANDROID_URL: runtimeConfig?.PROXY_APP_ANDROID_URL || import.meta.env.VITE_PROXY_APP_ANDROID_URL || '',
    VPN_WINDOWS_APP_NAME: runtimeConfig?.VPN_WINDOWS_APP_NAME || import.meta.env.VITE_VPN_WINDOWS_APP_NAME || 'Скачать',
    VPN_LINUX_APP_NAME: runtimeConfig?.VPN_LINUX_APP_NAME || import.meta.env.VITE_VPN_LINUX_APP_NAME || 'Скачать',
    VPN_MAC_APP_NAME: runtimeConfig?.VPN_MAC_APP_NAME || import.meta.env.VITE_VPN_MAC_APP_NAME || 'Скачать',
    VPN_IOS_APP_NAME: runtimeConfig?.VPN_IOS_APP_NAME || import.meta.env.VITE_VPN_IOS_APP_NAME || 'Скачать',
    VPN_ANDROID_APP_NAME: runtimeConfig?.VPN_ANDROID_APP_NAME || import.meta.env.VITE_VPN_ANDROID_APP_NAME || 'Скачать',
    PROXY_WINDOWS_APP_NAME: runtimeConfig?.PROXY_WINDOWS_APP_NAME || import.meta.env.VITE_PROXY_WINDOWS_APP_NAME || 'Скачать',
    PROXY_LINUX_APP_NAME: runtimeConfig?.PROXY_LINUX_APP_NAME || import.meta.env.VITE_PROXY_LINUX_APP_NAME || 'Скачать',
    PROXY_MAC_APP_NAME: runtimeConfig?.PROXY_MAC_APP_NAME || import.meta.env.VITE_PROXY_MAC_APP_NAME || 'Скачать',
    PROXY_IOS_APP_NAME: runtimeConfig?.PROXY_IOS_APP_NAME || import.meta.env.VITE_PROXY_IOS_APP_NAME || 'Скачать',
    PROXY_ANDROID_APP_NAME: runtimeConfig?.PROXY_ANDROID_APP_NAME || import.meta.env.VITE_PROXY_ANDROID_APP_NAME || 'Скачать',
    APPLE_TV_APP_NAME: runtimeConfig?.APPLE_TV_APP_NAME || import.meta.env.VITE_APPLE_TV_APP_NAME || 'Скачать',
    ANDROID_TV_APP_NAME: runtimeConfig?.ANDROID_TV_APP_NAME || import.meta.env.VITE_ANDROID_TV_APP_NAME || 'Скачать',
    WINDOWS_PROXY_URL_SCHEMA: runtimeConfig?.WINDOWS_PROXY_URL_SCHEMA || import.meta.env.VITE_WINDOWS_PROXY_URL_SCHEMA || '',
    LINUX_PROXY_URL_SCHEMA: runtimeConfig?.LINUX_PROXY_URL_SCHEMA || import.meta.env.VITE_LINUX_PROXY_URL_SCHEMA || '',
    MAC_PROXY_URL_SCHEMA: runtimeConfig?.MAC_PROXY_URL_SCHEMA || import.meta.env.VITE_MAC_PROXY_URL_SCHEMA || '',
    IOS_PROXY_URL_SCHEMA: runtimeConfig?.IOS_PROXY_URL_SCHEMA || import.meta.env.VITE_IOS_PROXY_URL_SCHEMA || '',
    ANDROID_PROXY_URL_SCHEMA: runtimeConfig?.ANDROID_PROXY_URL_SCHEMA || import.meta.env.VITE_ANDROID_PROXY_URL_SCHEMA || '',
    CAPTCHA_ENABLED: 'false',
    // CAPTCHA_ENABLED: runtimeConfig?.CAPTCHA_ENABLED || import.meta.env.VITE_CAPTCHA_ENABLED || 'false',
  };
}

export const config = getConfig();
