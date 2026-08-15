import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.burakakkaya.nextgammon',
  appName: 'NEXTGAMMON',
  webDir: 'dist',

  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    backgroundColor: '#050608',
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#050608',
      overlaysWebView: false,
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#050608',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#00e5ff',
    },
  },
};

export default config;
