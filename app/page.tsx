import { redirectToWorkspace } from "@/lib/auth/require-user";

export default async function Home() {
  await redirectToWorkspace();
}
