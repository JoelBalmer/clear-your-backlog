type Props = {
  name: string;
  selected?: boolean;
  onClick?: () => void;
};

const PlatformBadge: React.FC<Props> = ({ name, selected = false, onClick }) => {
  if (onClick) {
    return (
      <button
        type="button"
        className={`platform-badge${selected ? ' platform-badge--selected' : ''}`}
        onClick={onClick}
      >
        {name}
      </button>
    );
  }
  return (
    <span className={`platform-badge${selected ? ' platform-badge--selected' : ''}`}>{name}</span>
  );
};

export default PlatformBadge;
