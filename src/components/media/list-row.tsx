import { formatCreators, type Item, type UserItem } from "@/lib/domain";
import { StatusChip, VerdictChip } from "@/components/ui/chip";

interface ListRowProps {
  item: Item;
  userItem: UserItem;
  href: string;
}

export function ListRow({ item, userItem, href }: ListRowProps): JSX.Element {
  const titleClass = userItem.starred ? "list-row-title list-row-title-starred" : "list-row-title";
  const rowClass = userItem.starred ? "list-row list-row-starred" : "list-row";
  const creatorLabel =
    item.creators.length > 0
      ? formatCreators(item.creators)
      : item.provider === "MANUAL"
        ? "Manual entry"
        : "Creator unknown";

  return (
    <a className={rowClass} href={href}>
      <div className="list-row-thumb" aria-hidden="true">
        <span>{item.title.slice(0, 1).toUpperCase()}</span>
      </div>
      <div className="list-row-main">
        <h3 className={titleClass}>{item.title}</h3>
        <p className="list-row-meta">
          {item.year ?? "Year unknown"} - {creatorLabel}
        </p>
        <div className="list-row-chips">
          <StatusChip status={userItem.status} />
          <VerdictChip verdictScore={userItem.verdictScore} />
        </div>
      </div>
    </a>
  );
}
