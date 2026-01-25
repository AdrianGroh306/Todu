import Invite from "@/features/lists/components/invite";

export default function InvitePage({ params }: { params: { listId: string } }) {
  return <Invite listId={params.listId} />;
}
