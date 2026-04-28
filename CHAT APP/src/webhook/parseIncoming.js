export function parseIncomingMessage(body) {
  const value = body.entry[0].changes[0].value;
  const message = value.messages[0];

  const name =
    value.contacts &&
    value.contacts[0] &&
    value.contacts[0].profile &&
    value.contacts[0].profile.name
      ? value.contacts[0].profile.name
      : 'ahí';

  return {
    from: message.from,
    text: message.text.body,
    name, // ✅ nombre del contacto
    timestamp: message.timestamp
  };
}
