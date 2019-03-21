interface Luna {
  /** Gets Luna framework version */
  version: string;

  /** Return the current device (given by cordova). */
  ready(): boolean;

  /** Call the api2 Modules */
  call(moduleName: 'api2'): Promise<any>;

  /** Call the qrcode Modules */
  call(moduleName: 'qrcode'): Promise<QRCodeResponseSuccess | QRCodeResponseError>;
}

interface Window {
  luna: Luna;
}

/** Apache Cordova instance */
declare var luna: Luna;

declare module 'luna' {
  export = luna;
}

