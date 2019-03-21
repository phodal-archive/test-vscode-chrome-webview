interface Luna {
  /** Gets Luna framework version */
  version: string;

  /** Return the current device (given by cordova). */
  ready(): boolean;

  /** Call the Modules */
  call(moduleName:
         /** QRCODE */
         'qrcode'  |
         /** a API 2 */
         'api2'
  ): Promise<any>;
}

interface Window {
  luna: Luna;
}

/** Apache Cordova instance */
declare var luna: Luna;

declare module 'luna' {
  export = luna;
}

