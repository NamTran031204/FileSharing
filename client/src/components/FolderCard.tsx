import { FolderFilled } from '@ant-design/icons';

interface FolderCardProps {
  name: string;
  itemCount: number;
  onClick?: () => void;
}

const FolderCard = ({ name, itemCount, onClick }: FolderCardProps) => {
  const itemLabel = itemCount === 1 ? 'item' : 'items';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-border/40 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary transition group-hover:bg-primary group-hover:text-white">
        <FolderFilled className="text-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground transition group-hover:text-primary">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {itemCount} {itemLabel}
        </p>
      </div>
    </button>
  );
};

export default FolderCard;
