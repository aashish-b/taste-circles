import { EmptyState } from "@/components/ui/states";
import { listCirclesForCurrentUser } from "@/server/repositories";

export const dynamic = "force-dynamic";

export default async function PeoplePage(): Promise<JSX.Element> {
  const circles = await listCirclesForCurrentUser();

  return (
    <section className="stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Circles</p>
          <h1>People</h1>
        </div>
        <button className="button" type="button">
          New circle
        </button>
      </header>

      {circles.length === 0 ? (
        <EmptyState title="No circles yet" body="Create a circle to send recommendations." />
      ) : (
        circles.map((circle) => (
          <article key={circle.id} className="card stack">
            <header className="section-head">
              <h2>{circle.name}</h2>
              <button className="button button-secondary" type="button">
                Invite
              </button>
            </header>
            <ul className="member-list">
              {circle.members.map((member) => (
                <li key={member.id}>
                  <span>{member.displayName}</span>
                  <span className="muted">@{member.handle}</span>
                </li>
              ))}
            </ul>
          </article>
        ))
      )}
    </section>
  );
}
