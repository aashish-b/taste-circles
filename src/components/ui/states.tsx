interface EmptyStateProps {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
}: EmptyStateProps): JSX.Element {
  return (
    <section className="state-card">
      <h3>{title}</h3>
      <p>{body}</p>
      {actionLabel && actionHref ? (
        <a className="button button-secondary" href={actionHref}>
          {actionLabel}
        </a>
      ) : null}
    </section>
  );
}

interface ErrorStateProps {
  title: string;
  body: string;
}

export function ErrorState({ title, body }: ErrorStateProps): JSX.Element {
  return (
    <section className="state-card state-error" role="alert">
      <h3>{title}</h3>
      <p>{body}</p>
    </section>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }): JSX.Element {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-row">
          <div className="skeleton-thumb" />
          <div className="skeleton-lines">
            <div className="skeleton-line skeleton-line-title" />
            <div className="skeleton-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
