import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { cx } from '../lib';

export type DialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ComponentChildren;
  readonly className?: string;
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  className = '',
}: DialogProps): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        if (document.activeElement instanceof HTMLElement) {
          previouslyFocusedElementRef.current = document.activeElement;
        }
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
        previouslyFocusedElementRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
        previouslyFocusedElementRef.current = null;
      }
      onClose();
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={cx(
        'bg-surface border-border text-text m-auto max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-lg border p-0 shadow-2xl outline-none backdrop:bg-black/70 backdrop:backdrop-blur-xs',
        className,
      )}
      aria-labelledby="dialog-title"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="border-border flex items-center justify-between border-b pb-3">
          <h2 id="dialog-title" className="text-text text-base font-normal">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-dim hover:text-text hover:bg-surface-2 focus-visible:ring-accent cursor-pointer rounded p-1 transition-colors outline-none focus-visible:ring-2"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </dialog>
  );
}
