export function calculatePeopleAhead(ticketToken, currentToken) {
  return Math.max(ticketToken - currentToken - (currentToken > 0 ? 0 : 0), 0);
}

export function getQueueRoom(queueId) {
  return `queue:${queueId}`;
}

export function getUserRoom(userId) {
  return `user:${userId}`;
}
