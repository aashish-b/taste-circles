import { SkeletonRows } from "@/components/ui/states";

export default function Loading(): JSX.Element {
  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">Loading</p>
          <h1>Preparing view</h1>
        </div>
      </header>
      <SkeletonRows rows={5} />
    </section>
  );
}
