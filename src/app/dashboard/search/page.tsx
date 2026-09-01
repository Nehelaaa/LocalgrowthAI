import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-user";
import { SearchWorkspace } from "./SearchWorkspace";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/dashboard/search"));
  }

  return (
    <SearchWorkspace
      initialCity={user.targetCity ?? ""}
      initialState={user.targetState ?? ""}
      initialBusinessType={user.targetBusinessType ?? ""}
    />
  );
}
