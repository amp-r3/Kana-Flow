// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { isApplePlatform } from './platform';

describe('platform: the command key', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const withUserAgent = (userAgent: string): void => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
  };

  it('is Cmd on a Mac, an iPhone and an iPad', () => {
    withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15');
    expect(isApplePlatform()).toBe(true);
    withUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
    expect(isApplePlatform()).toBe(true);
    withUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
    expect(isApplePlatform()).toBe(true);
  });

  it('is Ctrl on Windows, Linux and Android', () => {
    withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120');
    expect(isApplePlatform()).toBe(false);
    withUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120');
    expect(isApplePlatform()).toBe(false);
    withUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120');
    expect(isApplePlatform()).toBe(false);
  });
});
