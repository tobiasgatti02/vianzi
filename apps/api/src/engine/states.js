export const STATES = {
  START: 'START',
  ASK_PURCHASE_TYPE: 'ASK_PURCHASE_TYPE', // contado / financiado

  // CONTADO
  ASK_CASH_METHOD: 'ASK_CASH_METHOD', // efectivo / auto / mixto
  CASH_CLOSE: 'CASH_CLOSE',

  // FINANCIADO
  ASK_FINANCE_SCHEME: 'ASK_FINANCE_SCHEME', // auto / efectivo / cuota a cuota
  ASK_QUOTA: 'ASK_QUOTA',
  FINANCE_CLOSE: 'FINANCE_CLOSE',

  DROP: 'DROP'
};