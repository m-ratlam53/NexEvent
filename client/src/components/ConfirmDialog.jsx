import { AnimatePresence, motion } from 'framer-motion';
import { BUTTON_SECONDARY, BUTTON_PRIMARY, BUTTON_DANGER_SOLID } from '../utils/styles';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 px-4 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-elevated-lg"
          >
            <h2 className="font-display text-base font-bold text-neutral-900">{title}</h2>
            {description && <p className="mt-2 text-sm text-neutral-500">{description}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onCancel} className={BUTTON_SECONDARY}>
                {cancelLabel}
              </button>
              <button onClick={onConfirm} className={danger ? BUTTON_DANGER_SOLID : BUTTON_PRIMARY}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
