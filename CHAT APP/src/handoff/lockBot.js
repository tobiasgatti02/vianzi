export function isBotLocked(session) {
  return session.handoff === true;
}