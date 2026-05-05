import { redirect } from "next/navigation";

/** Export lives on CRM Leads; keep route for bookmarks. */
export default function ExportPageRedirect() {
  redirect("/dashboard/leads#export");
}
