import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'site.jchapin.app',
  appName: 'j-chapin',
  webDir: 'www',
  plugins: {
    SocialLogin: {
      // Solo Google: los demás proveedores no se empaquetan en el APK.
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
      logLevel: 1,
    },
  },
};

export default config;
