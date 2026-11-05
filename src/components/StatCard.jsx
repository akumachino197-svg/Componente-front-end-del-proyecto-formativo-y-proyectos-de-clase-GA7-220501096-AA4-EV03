export default function StatCard({ title, value, detail, icon: Icon, tone = 'blue' }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-top">
        <span className="stat-icon"><Icon size={20} strokeWidth={1.9} /></span>
        <span className="stat-title">{title}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </article>
  );
}
