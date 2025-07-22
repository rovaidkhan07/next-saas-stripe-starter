import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { FocusFlowDashboard } from "@/components/dashboard/focus-flow-dashboard";

export const metadata = constructMetadata({
  title: "Dashboard – ADHD AI",
  description: "Your ADHD productivity dashboard with focus tracking, mood monitoring, and AI coaching.",
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return <FocusFlowDashboard />;
}
