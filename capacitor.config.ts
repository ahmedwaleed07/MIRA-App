import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.asas360.mira',
  appName: 'MIRA',
  webDir: 'www',
  bundledWebRuntime: false,
  server: { androidScheme: 'https' },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    preferredContentMode: 'mobile'
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#FF4D8D'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#FF4D8D',
      showSpinner: false
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#FF4D8D',
      style: 'LIGHT'
    },
    Keyboard: { resize: 'native' }
  }
};

export default config;
