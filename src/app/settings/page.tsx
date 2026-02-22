import { EmptyState } from "@/components/ui/states";

export default function SettingsPage(): JSX.Element {
  return (
    <section className="stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Preferences</p>
          <h1>Settings</h1>
        </div>
      </header>

      <article className="card stack">
        <h2>Linked accounts</h2>
        <p className="muted">
          Apple and Google accounts are linked explicitly by provider account ID.
        </p>
        <div className="button-row">
          <button className="button button-secondary" type="button">Link Apple</button>
          <button className="button button-secondary" type="button">Link Google</button>
        </div>
      </article>

      <article className="card stack">
        <h2>Session controls</h2>
        <p className="muted">Sessions are database-backed and revocable.</p>
        <button className="button button-secondary" type="button">Sign out all devices</button>
      </article>

      <details className="state-sample">
        <summary>Empty state preview</summary>
        <EmptyState title="No linked accounts" body="You can still sign in with username and password." />
      </details>
    </section>
  );
}
