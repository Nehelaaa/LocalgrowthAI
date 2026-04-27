import { TradesSubnav } from "./TradesSubnav";

export default function TradesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0 max-w-6xl">
      <TradesSubnav />
      {children}
    </div>
  );
}
