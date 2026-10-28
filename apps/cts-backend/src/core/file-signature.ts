const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const PDF = Buffer.from("%PDF-", "ascii");
// The PDF header may be preceded by junk bytes; readers accept it within the first 1 KiB.
const PDF_HEADER_WINDOW = 1024;

/** True when the file content matches the client-declared MIME type (which multer does not verify). */
export function contentMatchesMimeType(mimeType: string, data: Buffer): boolean {
  switch (mimeType) {
    case "image/png":
      return data.subarray(0, PNG.length).equals(PNG);
    case "image/jpeg":
      return data.subarray(0, JPEG.length).equals(JPEG);
    case "application/pdf":
      return data.subarray(0, PDF_HEADER_WINDOW).includes(PDF);
    default:
      return false;
  }
}
