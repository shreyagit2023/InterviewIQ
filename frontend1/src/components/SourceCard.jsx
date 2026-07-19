export default function SourceCard({ source }) {
  return (
    <div className="source-card">
      <div className="source-title">{source.filename}</div>

      <div className="source-page">
        Page {source.page}
      </div>
    </div>
  );
}