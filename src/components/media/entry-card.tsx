import { StatusChip, VerdictChip } from "@/components/ui/chip";
import { Sheet } from "@/components/ui/sheet";
import { VERDICT_LABEL, type UserItem } from "@/lib/domain";

export function EntryCard({ userItem }: { userItem: UserItem | null }): JSX.Element {
  if (!userItem) {
    return (
      <section className="entry-card">
        <h3>Your entry</h3>
        <p className="muted">You have not added this item yet.</p>
      </section>
    );
  }

  return (
    <section className="entry-card">
      <header className="entry-card-header">
        <h3>Your entry</h3>
        <Sheet title="Edit entry" triggerLabel="Edit entry">
          <form className="sheet-form" action="#">
            <label className="field">
              <span>Status</span>
              <select defaultValue={userItem.status}>
                <option value="NONE">Not started</option>
                <option value="STARTED">Started</option>
                <option value="FINISHED">Finished</option>
                <option value="DROPPED">Dropped</option>
              </select>
            </label>
            <label className="field">
              <span>Verdict score</span>
              <select defaultValue={userItem.verdictScore ?? ""}>
                <option value="">None</option>
                <option value="1">1 - {VERDICT_LABEL[1]}</option>
                <option value="2">2 - {VERDICT_LABEL[2]}</option>
                <option value="3">3 - {VERDICT_LABEL[3]}</option>
                <option value="4">4 - {VERDICT_LABEL[4]}</option>
                <option value="5">5 - {VERDICT_LABEL[5]}</option>
              </select>
            </label>
            <label className="field">
              <span>Impact age</span>
              <input type="number" defaultValue={userItem.impactAge ?? undefined} min={1} max={120} />
            </label>
            <label className="field">
              <span>Optional one-liner</span>
              <input maxLength={160} defaultValue={userItem.noteOneLiner ?? ""} />
            </label>
            <button className="button" type="button">
              Save
            </button>
          </form>
        </Sheet>
      </header>
      <div className="entry-card-row">
        <span className={userItem.starred ? "star-pill starred" : "star-pill"}>
          {userItem.starred ? "Starred" : "Unstarred"}
        </span>
        <StatusChip status={userItem.status} />
        <VerdictChip verdictScore={userItem.verdictScore} />
      </div>
      <p className="entry-card-meta">
        Impact age: {userItem.impactAge ?? "Not set"}
      </p>
      {userItem.noteOneLiner ? <p className="entry-card-note">{userItem.noteOneLiner}</p> : null}
    </section>
  );
}
