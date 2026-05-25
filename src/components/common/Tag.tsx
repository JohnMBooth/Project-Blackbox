interface TagProps {
  label: string;
  color?: string;
  onRemove?: () => void;
  onClick?: () => void;
}

export function Tag({ label, color, onRemove, onClick }: TagProps) {
  const style: React.CSSProperties = {};
  if (color) {
    style.background = `${color}20`;
    style.color = color;
  }

  return (
    <span className="tag" style={style} onClick={onClick}>
      {label}
      {onRemove && (
        <button className="ml-1 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </span>
  );
}
