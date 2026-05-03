type Props = {
  size?: number;
  showWordmark?: boolean;
  variant?: 'default' | 'mono';
};

const BrandMark: React.FC<Props> = ({ size = 56, showWordmark = false, variant = 'default' }) => {
  const accent = variant === 'mono' ? 'currentColor' : 'var(--brand-amber, #f59e0b)';
  const surface = variant === 'mono' ? 'transparent' : 'var(--brand-bg, #0f1530)';
  const dark = variant === 'mono' ? 'currentColor' : 'var(--brand-text, #f1ecdc)';

  // 8x8 pixel-art monogram: a play triangle with a small filled square underneath,
  // suggestive of a controller D-pad / start button.
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showWordmark ? 12 : 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect width="16" height="16" rx="3" fill={surface} />
        {/* Play triangle (pixel-stepped) */}
        <rect x="5" y="3" width="1" height="2" fill={accent} />
        <rect x="6" y="3" width="1" height="4" fill={accent} />
        <rect x="7" y="3" width="1" height="6" fill={accent} />
        <rect x="8" y="4" width="1" height="4" fill={accent} />
        <rect x="9" y="5" width="1" height="2" fill={accent} />
        {/* Underline / "start" bar */}
        <rect x="4" y="11" width="8" height="2" fill={dark} />
      </svg>
      {showWordmark && (
        <span
          className="brand-wordmark"
          style={{
            fontSize: Math.max(10, Math.round(size * 0.22)),
            color: variant === 'mono' ? 'currentColor' : 'var(--brand-text, #1a1733)',
            lineHeight: 1,
          }}
        >
          CYB
        </span>
      )}
    </span>
  );
};

export default BrandMark;
