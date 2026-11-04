import type * as React from 'react';

/* ================= Test stream =================
 * Reference implementation in React; the product rewrites it in Preact (shared/ui).
 * Contract: the component renders ONCE per prompt. Every keystroke goes through the controller
 * (classList / textContent / transform writes against cached positions) — 0 renders per key.
 */
export type CharState = 'untyped' | 'correct' | 'miss';
export interface TestController {
  /** Mark char i. Colour switches instantly (no transition). */
  mark(i: number, state: CharState): void;
  /** Move the caret to char i; skip chars before it become `is-skip is-done`. */
  moveTo(i: number): void;
  /** Next index ≥ i that needs input (skips spaces and punctuation). */
  nextTypeable(i: number): number;
  /** Pending romaji from engine.view(); positioned under the caret, clamped to the line end. Never shifts text. */
  setBuffer(romaji: string): void;
  /** Rejected key: miss flash on the caret for dur-reject (opacity layer, WAAPI). */
  reject(): void;
  setCounter(value: string | number): void;
  setLive(kpm: string | number, accuracy: string | number): void;
  /** Caret blinks while the user is idle > 1 s. */
  idle(on: boolean): void;
  /** Called automatically on window blur / focus — not on focus moving to Restart or a link. */
  setWindowFocus(focused: boolean): void;
  reset(): void;
  isSkip(i: number): boolean;
  readonly length: number;
  /** Re-read positions (called on resize and fonts.ready). */
  measure(): void;
  destroy(): void;
}
export declare function createTestController(root: HTMLElement, opts?: { lines?: number }): TestController;

export interface TestAreaProps {
  /** Prompt in kana. 'words' and 'kana' join items with a skip space; 'phrase' renders one run. */
  words: string[];
  mode?: 'words' | 'phrase' | 'kana';
  /** Initial counter value; later updates go through the controller. */
  counter?: string | number | null;
  /** Live KPM and accuracy next to the counter (default true). */
  live?: boolean;
  /** Visible lines: 3 on desktop, 2 below bp-narrow by default. */
  lines?: number;
  /** i18n strings: { kpm, acc, blur }. */
  labels?: { kpm?: string; acc?: string; blur?: string; repeat?: string };
  /** Repeat run (ADR 033): static outlined «повтор» mark in fur-dim after KPM and accuracy. Set once per test. */
  repeat?: boolean;
  /** Receives the controller after mount and after every prompt change. */
  onReady?: (ctl: TestController) => void;
  /** Called on every render — for render-count tests. */
  onRender?: () => void;
  className?: string;
}
export declare const TestArea: React.ForwardRefExoticComponent<TestAreaProps & React.RefAttributes<{ current: TestController | null }>>;

export interface CharProps { kana: string; state?: CharState | 'current'; skip?: boolean }
export declare function Char(props: CharProps): React.ReactElement;

export interface TranslationLineProps {
  /** Translation in the UI language; empty keeps the reserved height. */
  text?: React.ReactNode;
  /** Tatoeba link — required for phrases (licence), absent for words. */
  sourceHref?: string | null;
  onReport?: () => void;
  /** Disables «Report a problem» with an explanation. */
  offline?: boolean;
  labels?: { source?: string; report?: string; offline?: string };
  className?: string;
}
export declare function TranslationLine(props: TranslationLineProps): React.ReactElement;

export interface NoticeProps {
  children?: React.ReactNode;
  /** Romaji line (Esc hint) in mono-romaji. */
  mono?: boolean;
  tone?: 'default' | 'miss';
  /** Keep the slot's height when empty so the text never jumps. */
  reserve?: boolean;
  /** Trailing action, e.g. a «sign in again» link. */
  action?: React.ReactNode;
  role?: 'status' | 'alert';
  className?: string;
}
export declare function Notice(props: NoticeProps): React.ReactElement;

export interface KbdProps { children: React.ReactNode; /** No keycap border — inside buttons. */ bare?: boolean; className?: string }
export declare function Kbd(props: KbdProps): React.ReactElement;

/* ================= Modes ================= */
export interface ModeValue {
  script: 'hiragana' | 'katakana' | 'both';
  content: 'kana' | 'words' | 'phrases';
  /** Engine `Strictness`: 'learner' = relaxed, 'ime' = strict IME. */
  strict: 'learner' | 'ime';
  type: 'time' | 'count' | 'zen';
  /** Seconds (15/30/60/120) or items (10/25/50/100); ignored for zen. */
  amount: number;
  weakFocus: boolean;
  /** Number of selected rows, shown on the «rows…» button (kana content only). */
  rows: number;
}
export interface ModePanelProps {
  value: Partial<ModeValue>;
  onChange?: (value: ModeValue) => void;
  /** Opens the RowPicker dialog. */
  onRows?: () => void;
  lang?: 'ru' | 'en';
  labels?: Record<string, string>;
  className?: string;
}
export declare function ModePanel(props: ModePanelProps): React.ReactElement;

export interface RowPickerProps {
  script?: 'hiragana' | 'katakana' | 'both';
  /** Engine `RowId`s: vowels k s t n h m y r w_n · g z d b p · ky sh ch ny hy my ry gy j by py · ext_fa ext_va ext_wi ext_ti ext_che (katakana and 'both' only). */
  value: string[];
  onChange?: (rows: string[]) => void;
  labels?: { base?: string; voiced?: string; combo?: string; all?: string; none?: string; count?: (n: number) => string; empty?: string };
}
export declare function RowPicker(props: RowPickerProps): React.ReactElement;

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Buttons, safe action first — it receives initial focus. */
  actions?: React.ReactNode[];
  /** Render in place without a modal backdrop (docs only). */
  inline?: boolean;
  className?: string;
}
export declare function Dialog(props: DialogProps): React.ReactElement;

/* ================= Controls ================= */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
  size?: 'md' | 'sm';
  /** Key hint after the label: 'enter', 'ctrl + enter'. */
  hint?: string;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface SegmentedOption { value: string | number; label: React.ReactNode; disabled?: boolean }
export interface SegmentedProps {
  options: SegmentedOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  label: string;
  mono?: boolean;
  className?: string;
}
export declare function Segmented(props: SegmentedProps): React.ReactElement;

export interface SwitchProps { label: React.ReactNode; description?: React.ReactNode; checked?: boolean; defaultChecked?: boolean; onChange?: (checked: boolean) => void; disabled?: boolean; className?: string }
export declare function Switch(props: SwitchProps): React.ReactElement;

export interface FieldProps { label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode }
export interface InputProps extends FieldProps, React.InputHTMLAttributes<HTMLInputElement> { mono?: boolean }
export declare function Input(props: InputProps): React.ReactElement;
export interface TextareaProps extends FieldProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export declare function Textarea(props: TextareaProps): React.ReactElement;
export interface SelectProps extends FieldProps, React.SelectHTMLAttributes<HTMLSelectElement> { options: { value: string; label: React.ReactNode; disabled?: boolean }[] }
export declare function Select(props: SelectProps): React.ReactElement;

export interface TooltipProps { label: React.ReactNode; side?: 'top' | 'bottom'; open?: boolean; children: React.ReactElement }
export declare function Tooltip(props: TooltipProps): React.ReactElement;

/* ================= Results & stats ================= */
export interface StatProps { label: React.ReactNode; value: React.ReactNode; unit?: string; note?: React.ReactNode; size?: 'hero' | 'md'; /** e.g. <PersonalBestBadge/> next to the label */ badge?: React.ReactNode; className?: string }
export declare function Stat(props: StatProps): React.ReactElement;

export interface PersonalBestBadgeProps { children?: React.ReactNode }
export declare function PersonalBestBadge(props: PersonalBestBadgeProps): React.ReactElement;

export interface ResultChartProps {
  /** One series: cumulative KPM per second (results) or KPM per test (/stats). */
  values: number[];
  height?: number;
  /** Suffix for the last x label: ' c' / ' s' / ''. */
  xUnit?: string;
  /** Tooltip text for point i. */
  tip?: (i: number, v: number) => string;
  cursor?: number;
  label?: string;
  className?: string;
}
export declare function ResultChart(props: ResultChartProps): React.ReactElement;

export interface WeakKana { kana: string; spellings: string[]; ms: number; misses: number }
export interface WeakKanaListProps { items: WeakKana[]; labels?: { kana?: string; typed?: string; time?: string; misses?: string; ms?: string } }
export declare function WeakKanaList(props: WeakKanaListProps): React.ReactElement;

export type KanaChartDatum = { v: number; n?: number } | number | 'new' | 'locked';
export interface KanaChartProps {
  /** miss: error rate 0–1 → heat-miss; time: reaction ms → heat-fur; box: Leitner box 0–5 → heat-fur + eye mark at 4–5. */
  mode: 'miss' | 'time' | 'box';
  script?: 'hiragana' | 'katakana';
  /** Keyed by kana. Missing key = no data / not introduced. */
  data: Record<string, KanaChartDatum>;
  onSelect?: (kana: string) => void;
  label: string;
  labels?: Record<string, string | ((...a: any[]) => string)>;
  className?: string;
}
export declare function KanaChart(props: KanaChartProps): React.ReactElement;

export interface HistoryRow { date: string; mode: string; kpm: number; acc: number; time: string; best?: boolean }
export interface HistoryTableProps { rows: HistoryRow[]; loading?: boolean; bestLabel?: string; labels?: Record<string, string> }
export declare function HistoryTable(props: HistoryTableProps): React.ReactElement;

export interface PaginationProps { page: number; pages: number; onPage?: (page: number) => void; labels?: { prev?: string; next?: string; label?: string } }
export declare function Pagination(props: PaginationProps): React.ReactElement;

/* ================= Learning ================= */
export interface OptionCardProps {
  /** 1–4: the key that picks it. */
  n: number;
  children: React.ReactNode;
  /** Content is kana (jp-test-sm) rather than romaji (mono-stat). */
  kana?: boolean;
  state?: 'idle' | 'correct' | 'wrong' | 'reveal';
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}
export declare function OptionCard(props: OptionCardProps): React.ReactElement;

export interface VerticalLabelProps { children: React.ReactNode; ariaLabel: string; className?: string }
export declare function VerticalLabel(props: VerticalLabelProps): React.ReactElement;

/* ================= Shell ================= */
export interface NavItem { id: string; label: React.ReactNode; href?: string }
export interface NavProps {
  items: NavItem[];
  active?: string | null;
  /** During a test: fades out, then visibility: hidden + inert — out of the Tab order. */
  hidden?: boolean;
  lang?: 'en' | 'ru';
  onLang?: (lang: 'en' | 'ru') => void;
  /** Sign-in link label (leads to /settings); null hides it (signed in, preview environments). */
  loginLabel?: string | null;
  onNavigate?: (id: string) => void;
  label?: string;
  langLabel?: string;
  homeHref?: string;
  homeLabel?: string;
  className?: string;
}
export declare function Nav(props: NavProps): React.ReactElement;

export interface FooterProps { links: { id: string; label: React.ReactNode; href?: string; onClick?: () => void }[]; hidden?: boolean }
export declare function Footer(props: FooterProps): React.ReactElement;

export type CatMood = 'neutral' | 'sleep' | 'content';
export interface CatProps {
  /** Product style is 'geometry'. 'line' and 'silhouette' are archived. */
  variant?: 'geometry' | 'line' | 'silhouette';
  mood?: CatMood;
  mark?: boolean;
  size?: number;
  label?: string;
  className?: string;
}
export declare function Cat(props: CatProps): React.ReactElement;

export interface EmptyStateProps { title: React.ReactNode; text?: React.ReactNode; action?: React.ReactNode; mood?: 'sleep' | 'neutral'; size?: number; className?: string }
export declare function EmptyState(props: EmptyStateProps): React.ReactElement;

export declare function useNarrow(): boolean;

export interface KanaRow { group: 'base' | 'voiced' | 'combo' | 'ext'; id: string; head: string; hira: (string | null)[] | null; kata: (string | null)[] }
/** Rows of a track in table order: hiragana 26, katakana 31 (`'both'` = 31). */
export declare function kanaRows(script: 'hiragana' | 'katakana' | 'both'): KanaRow[];
/** Every kana of a track: hiragana 104, katakana 125. */
export declare function kanaOf(script: 'hiragana' | 'katakana'): string[];

declare global {
  interface Window {
    Nekotype: {
      TestArea: typeof TestArea; Char: typeof Char; TranslationLine: typeof TranslationLine; Notice: typeof Notice; Kbd: typeof Kbd;
      ModePanel: typeof ModePanel; RowPicker: typeof RowPicker; Dialog: typeof Dialog; Button: typeof Button; Segmented: typeof Segmented;
      Switch: typeof Switch; Input: typeof Input; Textarea: typeof Textarea; Select: typeof Select; Tooltip: typeof Tooltip;
      Stat: typeof Stat; PersonalBestBadge: typeof PersonalBestBadge; ResultChart: typeof ResultChart; WeakKanaList: typeof WeakKanaList;
      KanaChart: typeof KanaChart; HistoryTable: typeof HistoryTable; Pagination: typeof Pagination; OptionCard: typeof OptionCard;
      VerticalLabel: typeof VerticalLabel; Nav: typeof Nav; Footer: typeof Footer; Cat: typeof Cat; EmptyState: typeof EmptyState;
      createTestController: typeof createTestController; useNarrow: typeof useNarrow; kanaRows: typeof kanaRows; kanaOf: typeof kanaOf;
    };
  }
}
