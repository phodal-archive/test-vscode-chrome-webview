/** QRCode Promise Success */
interface QRCodeResponseSuccess {
  data: {
    message: string
  };
  status: 'success';
}

/** QRCode Promise Error */
interface QRCodeResponseError {
  data: {
    message: string
  };
  status: 'success' | 'fail';
}
