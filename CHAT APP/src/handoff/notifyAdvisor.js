export function notifyAdvisor(session) {
  console.log('📞 HANDOFF HUMANO ACTIVADO');
  console.log('Cliente:', session.phone);
  console.log('Estado:', session);
}