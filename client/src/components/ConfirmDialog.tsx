import Button from "./Button";
import Modal from "./Modal";

type Props = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "حذف",
  cancelLabel = "إلغاء",
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  return (
    <Modal open={open} title={title} onClose={() => (loading ? undefined : onCancel())}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/20 bg-[#181825]/70 p-4 text-sm text-white/80">
          {message}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
