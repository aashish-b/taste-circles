"use client";

import { useState } from "react";

interface SheetProps {
  title: string;
  triggerLabel: string;
  children: React.ReactNode;
}

export function Sheet({ title, triggerLabel, children }: SheetProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="button button-secondary" onClick={() => setIsOpen(true)} type="button">
        {triggerLabel}
      </button>
      {isOpen ? (
        <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label={title}>
          <button
            className="sheet-dismiss"
            aria-label="Close"
            type="button"
            onClick={() => setIsOpen(false)}
          />
          <aside className="sheet-panel">
            <header className="sheet-header">
              <h2>{title}</h2>
              <button className="button button-quiet" onClick={() => setIsOpen(false)} type="button">
                Close
              </button>
            </header>
            <div className="sheet-content">{children}</div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
