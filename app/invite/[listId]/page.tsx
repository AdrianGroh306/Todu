import InviteClient from "@/features/lists/components/invite-client";

export default function InvitePage({ params }: { params: { listId: string } }) {
  return <InviteClient listId={params.listId} />;
}
