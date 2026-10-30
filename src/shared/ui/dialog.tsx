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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
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
        'm-auto rounded-lg bg-surface border border-border text-text p-0 backdrop:bg-black/70 backdrop:backdrop-blur-xs outline-none shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto',
        className,
      )}
      aria-labelledby="dialog-title"
    >
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 id="dialog-title" className="text-base font-normal text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-dim hover:text-text cursor-pointer p-1 rounded hover:bg-surface-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
