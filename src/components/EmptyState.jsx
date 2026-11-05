import { PackageOpen } from 'lucide-react';

export default function EmptyState({ title, message }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><PackageOpen size={24} /></span>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
