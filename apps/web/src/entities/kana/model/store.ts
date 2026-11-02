import type { ReadonlySignal } from '@preact/signals';
import { signal } from '@preact/signals';
import { allKanaRows } from './data';
import type { PracticeSettings, RowId, ScriptMode, ContentKind, Strictness } from './types';
import type { KeyValueStore } from '@/shared/lib';
import { STORAGE_KEYS, isSettings, createDebouncedSaver } from '@/shared/lib';

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

const _scriptSetting = signal<ScriptMode>('both');
const _contentSetting = signal<ContentKind>('single');
const _strictnessSetting = signal<Strictness>('learner');
const _rowIdsSetting = signal<readonly RowId[]>(DEFAULT_BASIC_ROWS);
const _weakFocusSetting = signal<boolean>(true);

export const scriptSetting: ReadonlySignal<ScriptMode> = _scriptSetting;
export const contentSetting: ReadonlySignal<ContentKind> = _contentSetting;
export const strictnessSetting: ReadonlySignal<Strictness> = _strictnessSetting;
export const rowIdsSetting: ReadonlySignal<readonly RowId[]> = _rowIdsSetting;
export const weakFocusSetting: ReadonlySignal<boolean> = _weakFocusSetting;

let boundStore: KeyValueStore | null = null;
let debouncedSaver: ReturnType<typeof createDebouncedSaver> | null = null;

function saveCurrentSettings(): void {
  if (!boundStore) return;
  const current = {
    v: 1 as const,
    script: _scriptSetting.value,
    content: _contentSetting.value,
    strictness: _strictnessSetting.value,
    rowIds: _rowIdsSetting.value,
    weakFocus: _weakFocusSetting.value,
    // Note: session test config is merged when saving full settings
  };
  // Retrieve existing test config if present
  try {
    const raw = boundStore.get(STORAGE_KEYS.SETTINGS);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    const testConfig = isSettings(parsed)
      ? parsed.test
      : { kind: 'time' as const, seconds: 30 as const };
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
        _scriptSetting.value = parsed.script;
        _contentSetting.value = parsed.content;
        _strictnessSetting.value = parsed.strictness;
        // Verify valid row IDs
        const validRows = parsed.rowIds.filter(isRowId);
        if (validRows.length > 0) {
          _rowIdsSetting.value = validRows;
        }
        _weakFocusSetting.value = parsed.weakFocus;
        return;
      }
    } catch {
      // Fallback silently to defaults
    }
  }

  // Fallback to defaults
  _scriptSetting.value = 'both';
  _contentSetting.value = 'single';
  _strictnessSetting.value = 'learner';
  _rowIdsSetting.value = DEFAULT_BASIC_ROWS;
  _weakFocusSetting.value = true;
}

export function getPracticeSettings(): PracticeSettings {
  return {
    script: _scriptSetting.value,
    content: _contentSetting.value,
    strictness: _strictnessSetting.value,
    rowIds: _rowIdsSetting.value,
    weakFocus: _weakFocusSetting.value,
  };
}

export function setScript(script: ScriptMode): void {
  _scriptSetting.value = script;
  notifyChange();
}

export function setContent(content: ContentKind): void {
  _contentSetting.value = content;
  notifyChange();
}

export function setStrictness(strictness: Strictness): void {
  _strictnessSetting.value = strictness;
  notifyChange();
}

export function setWeakFocus(focus: boolean): void {
  _weakFocusSetting.value = focus;
  notifyChange();
}

export function toggleWeakFocus(): void {
  _weakFocusSetting.value = !_weakFocusSetting.value;
  notifyChange();
}

// Domain rule: at least one row must stay selected!
export function toggleRow(rowId: RowId): boolean {
  const current = _rowIdsSetting.value;
  if (current.includes(rowId)) {
    if (current.length <= 1) {
      return false; // Rejected: cannot remove last row
    }
    _rowIdsSetting.value = current.filter((id) => id !== rowId);
    notifyChange();
    return true;
  } else {
    _rowIdsSetting.value = [...current, rowId];
    notifyChange();
    return true;
  }
}

export function selectAllRows(allIds: readonly RowId[]): void {
  _rowIdsSetting.value = [...allIds];
  notifyChange();
}

export function clearRows(keepFirst: RowId = 'vowels'): void {
  _rowIdsSetting.value = [keepFirst];
  notifyChange();
}

export function presetBasic(): void {
  _rowIdsSetting.value = [...DEFAULT_BASIC_ROWS];
  notifyChange();
}
