/** 图片一律读成 data URL：不上传、不留临时对象 URL，导出时也不会跨域 */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error('读不了这个文件'));
    fr.readAsDataURL(file);
  });
}
