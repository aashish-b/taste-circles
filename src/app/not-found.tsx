import { EmptyState } from "@/components/ui/states";

export default function NotFound(): JSX.Element {
  return (
    <EmptyState
      title="Not found"
      body="The page you requested does not exist in this build."
      actionLabel="Go to Me"
      actionHref="/me"
    />
  );
}
