import { useEffect, useRef } from "react";

type Props = { busy: boolean; onCancel: () => void; onConfirm: () => void };

export function ResetDialog({ busy, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className="reset-dialog"
      ref={ref}
      aria-labelledby="reset-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <span className="eyebrow">НОВАЯ ЭКСПЕДИЦИЯ</span>
      <h2 id="reset-title">Начать сначала?</h2>
      <p>
        Текущая партия, доставки и журнал будут удалены. База вернётся к первому
        дню.
      </p>
      <div className="dialog-actions">
        <button
          className="button button--ghost"
          type="button"
          disabled={busy}
          onClick={onCancel}
        >
          Продолжить игру
        </button>
        <button
          className="button button--primary"
          type="button"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Подготовка…" : "Начать заново"}
        </button>
      </div>
    </dialog>
  );
}
