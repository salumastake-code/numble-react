import useStore from '../store/useStore';
import './Toast.css';

export default function Toast() {
  const toast = useStore(s => s.toast);
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.msg}
    </div>
  );
}
