import { useEffect, useState } from 'preact/hooks';

function matches(query: string): boolean {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** Whether a media query holds. It renders again when the answer changes, and only then. */
export function useMediaQuery(query: string): boolean {
  const [holds, setHolds] = useState(() => matches(query));

  useEffect(() => {
    let list: MediaQueryList;
    try {
      list = window.matchMedia(query);
    } catch {
      return undefined;
    }
    const update = (): void => {
      setHolds(list.matches);
    };
    update();
    list.addEventListener('change', update);
    return () => {
      list.removeEventListener('change', update);
    };
  }, [query]);

  return holds;
}
