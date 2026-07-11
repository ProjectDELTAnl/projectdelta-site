export function isWebKitUserAgent(userAgent: string) {
  const appleMobile = /(?:iPad|iPhone|iPod)/u.test(userAgent);
  const chromiumEngine =
    !appleMobile &&
    /(?:Chrome|Chromium|Edg|HeadlessChrome|OPR|SamsungBrowser)/u.test(
      userAgent,
    );

  return /AppleWebKit/u.test(userAgent) && !chromiumEngine;
}
