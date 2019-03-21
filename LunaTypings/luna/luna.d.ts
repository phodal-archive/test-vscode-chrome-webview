interface Luna {
  version: string;

  /**
   * Return the current device (given by cordova).
   */
  ready(): boolean;
}

