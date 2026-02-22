import { EmptyState } from "@/components/ui/states";

export default function AuthPage(): JSX.Element {
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">Access</p>
          <h1>Sign in</h1>
        </div>
      </header>

      <div className="card stack">
        <p className="muted">
          OAuth identities are provider-scoped. Accounts are linked explicitly and never merged by email.
        </p>
        <div className="button-row">
          <button className="button" type="button">Continue with Apple</button>
          <button className="button button-secondary" type="button">Continue with Google</button>
        </div>
      </div>

      <div className="card stack">
        <h2>Credentials</h2>
        <form className="sheet-form" action="#">
          <label className="field">
            <span>Username</span>
            <input placeholder="name or email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" />
          </label>
          <button className="button" type="button">Sign in</button>
        </form>
      </div>

      <details className="state-sample">
        <summary>Error state preview</summary>
        <EmptyState title="Auth callback pending" body="Use this area for provider callback failures and recovery." />
      </details>
    </section>
  );
}
