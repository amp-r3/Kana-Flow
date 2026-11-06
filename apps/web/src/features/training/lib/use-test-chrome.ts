import { useSignalEffect } from '@preact/signals';
import type { Session } from '../model/session';

// Moving the mouse this far brings the hidden interface back.
const PEEK_DISTANCE_PX = 8;

/**
 * While a test runs, the navigation, the mode panel and the footer are hidden and leave the tab
 * order, so the first Tab reaches Restart (docs/design, "Экран теста"). It is one attribute on the
 * document, `data-testing`, that the stylesheet turns into `opacity` and `visibility` for the
 * elements marked `data-chrome`: no component renders when the first key starts the test. It ends
 * with the test; a mouse movement beyond a few pixels shows the interface again until the next key
 * other than Tab and Shift. A key press also forgets where the mouse started, so a slow drift over
 * a whole test shows nothing.
 */
export function useTestChrome(session: Session): void {
  useSignalEffect(() => {
    const root = document.documentElement;
    if (session.phase.value !== 'running') {
      root.removeAttribute('data-testing');
      return undefined;
    }
    root.setAttribute('data-testing', '');

    let origin: { x: number; y: number } | null = null;
    const onMove = (event: MouseEvent): void => {
      origin ??= { x: event.clientX, y: event.clientY };
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > PEEK_DISTANCE_PX) {
        root.removeAttribute('data-testing');
        origin = null;
      }
    };
    // Any key counts as the start of a new movement. Tab and Shift only walk the focus through the
    // interface that is shown: they must not hide it from under the user.
    const onKey = (event: KeyboardEvent): void => {
      origin = null;
      if (event.key === 'Tab' || event.key === 'Shift') return;
      if (!root.hasAttribute('data-testing')) root.setAttribute('data-testing', '');
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onKey, true);
      root.removeAttribute('data-testing');
    };
  });
}
