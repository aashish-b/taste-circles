import { EmptyState } from "@/components/ui/states";
import { listCirclesWithPulseForCurrentUser } from "@/server/repositories";

export const dynamic = "force-dynamic";

export default async function PeoplePage(): Promise<JSX.Element> {
  const pulse = await listCirclesWithPulseForCurrentUser(30);
  const circles = pulse.circles;

  return (
    <section className="stack">
      <header className="page-head">
        <div>
          <p className="eyebrow">Circles</p>
          <h1>People</h1>
          <p className="muted">Exchange pulse over the last {pulse.windowDays} days.</p>
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
              <div>
                <h2>{circle.name}</h2>
                <p className="muted">
                  You sent {circle.sentByYou} · You received {circle.receivedFromThem}
                </p>
              </div>
              <button className="button button-secondary" type="button">
                Invite
              </button>
            </header>
            {circle.members.length === 0 ? (
              <p className="muted">No members yet. Invite people to start your exchange pulse.</p>
            ) : (
              <ul className="member-list member-pulse-list">
                {circle.members.map((member) => (
                  <li key={member.id}>
                    <div>
                      <span>{member.displayName}</span>
                      <span className="muted"> @{member.handle}</span>
                    </div>
                    <div className="member-pulse-stats">
                      <span className="chip chip-neutral">Sent {member.sentByYou}</span>
                      <span className="chip chip-neutral">Received {member.receivedFromThem}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))
      )}
    </section>
  );
}
