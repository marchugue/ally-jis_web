export function getReplyComposeLabel(
  replyTargetSenderId: string,
  currentUserId: string,
  participantName: string,
): string {
  if (replyTargetSenderId === currentUserId) {
    return 'Reply to yourself';
  }
  return `Reply to ${participantName}`;
}

export function getReplyBubbleLabel(
  viewerId: string,
  messageSenderId: string,
  replyTargetSenderId: string,
  participantName: string,
): string {
  const viewerIsSender = viewerId === messageSenderId;
  const replyToSelf = replyTargetSenderId === messageSenderId;

  if (viewerIsSender) {
    if (replyToSelf) return 'You replied to yourself';
    return `You replied to ${participantName}`;
  }

  if (replyToSelf) {
    return `${participantName} replied to themselves`;
  }

  if (replyTargetSenderId === viewerId) {
    return `${participantName} replied to you`;
  }

  return `${participantName} replied to a message`;
}
