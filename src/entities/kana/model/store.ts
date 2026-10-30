import { signal } from '@preact/signals';
import { allKanaRows } from './data';
import type {
  PracticeSettings,
  RowId,
  ScriptMode,
  ContentKind,
  Strictness,
} from './types';
import type { KeyValueStore } from '@/shared/lib';
import {
  STORAGE_KEYS,
  isSettings,
  createDebouncedSaver,
} from '@/shared/lib';

const VALID_ROW_IDS = new Set<string>(allKanaRows.map((r) => r.id));

function isRowId(id: string): id is RowId {
  return VALID_ROW_IDS.has(id);
}

export const DEFAULT_BASIC_ROWS: readonly RowId[] = [
  'vowels',
  'k',
  's',
  't',
  'n',
  'h',
  'm',
  'y',
  'r',
  'w_n',
];

export const scriptSetting = signal<ScriptMode>('both');
export const contentSetting = signal<ContentKind>('single');
export const strictnessSetting = signal<Strictness>('learner');
export const rowIdsSetting = signal<readonly RowId[]>(DEFAULT_BASIC_ROWS);
export const weakFocusSetting = signal<boolean>(true);

let boundStore: KeyValueStore | null = null;
let debouncedSaver: ReturnType<typeof createDebouncedSaver> | null = null;

function saveCurrentSettings(): void {
  if (!boundStore) return;
  const current = {
    v: 1 as const,
    script: scriptSetting.value,
    content: contentSetting.value,
    strictness: strictnessSetting.value,
    rowIds: rowIdsSetting.value,
    weakFocus: weakFocusSetting.value,
    // Note: session test config is merged when saving full settings
  };
  // Retrieve existing test config if present
  try {
    const raw = boundStore.get(STORAGE_KEYS.SETTINGS);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const testConfig = isSettings(parsed) ? parsed.test : { kind: 'time' as const, seconds: 30 as const };
    const full = { ...current, test: testConfig };
    boundStore.set(STORAGE_KEYS.SETTINGS, JSON.stringify(full));
  } catch {
    // Ignore error
  }
}

export function flushPracticeSettings(): void {
  debouncedSaver?.flush();
}

function notifyChange(): void {
  if (debouncedSaver) {
    debouncedSaver.trigger();
  }
}

export function initPracticeSettings(store: KeyValueStore): void {
  boundStore = store;
  debouncedSaver = createDebouncedSaver(saveCurrentSettings, 300);

  const raw = store.get(STORAGE_KEYS.SETTINGS);
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isSettings(parsed)) {
        scriptSetting.value = parsed.script;
        contentSetting.value = parsed.content;
        strictnessSetting.value = parsed.strictness;
        // Verify valid row IDs
        const validRows = parsed.rowIds.filter(isRowId);
        if (validRows.length > 0) {
          rowIdsSetting.value = validRows;
        }
        weakFocusSetting.value = parsed.weakFocus;
        return;
      }
    } catch {
      // Fallback silently to defaults
    }
  }

  // Fallback to defaults
  scriptSetting.value = 'both';
  contentSetting.value = 'single';
  strictnessSetting.value = 'learner';
  rowIdsSetting.value = DEFAULT_BASIC_ROWS;
  weakFocusSetting.value = true;
}

export function getPracticeSettings(): PracticeSettings {
  return {
    script: scriptSetting.value,
    content: contentSetting.value,
    strictness: strictnessSetting.value,
    rowIds: rowIdsSetting.value,
    weakFocus: weakFocusSetting.value,
  };
}

export function setScript(script: ScriptMode): void {
  scriptSetting.value = script;
  notifyChange();
}

export function setContent(content: ContentKind): void {
  contentSetting.value = content;
  notifyChange();
}

export function setStrictness(strictness: Strictness): void {
  strictnessSetting.value = strictness;
  notifyChange();
}

export function setWeakFocus(focus: boolean): void {
  weakFocusSetting.value = focus;
  notifyChange();
}

export function toggleWeakFocus(): void {
  weakFocusSetting.value = !weakFocusSetting.value;
  notifyChange();
}

// Domain rule: at least one row must stay selected!
export function toggleRow(rowId: RowId): boolean {
  const current = rowIdsSetting.value;
  if (current.includes(rowId)) {
    if (current.length <= 1) {
      return false; // Rejected: cannot remove last row
    }
    rowIdsSetting.value = current.filter((id) => id !== rowId);
    notifyChange();
    return true;
  } else {
    rowIdsSetting.value = [...current, rowId];
    notifyChange();
    return true;
  }
}

export function selectAllRows(allIds: readonly RowId[]): void {
  rowIdsSetting.value = [...allIds];
  notifyChange();
}

export function clearRows(keepFirst: RowId = 'vowels'): void {
  rowIdsSetting.value = [keepFirst];
  notifyChange();
}

export function presetBasic(): void {
  rowIdsSetting.value = [...DEFAULT_BASIC_ROWS];
  notifyChange();
}
