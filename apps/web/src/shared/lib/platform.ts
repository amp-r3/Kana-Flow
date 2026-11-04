/** Whether the keyboard has Cmd rather than Ctrl as its command key: Mac, iPhone and iPad. */
export function isApplePlatform(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}
