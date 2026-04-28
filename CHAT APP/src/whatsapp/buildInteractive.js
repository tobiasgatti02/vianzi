export function buildInteractive(intent) {
  switch (intent) {
    case "WIZ_USE_CASE":
      return {
        type: "list",
        header: { type: "text", text: "¿Para qué lo vas a usar?" },
        body: { text: "Elegí una opción 👇" },
        action: {
          button: "Ver opciones",
          sections: [
            {
              title: "Uso",
              rows: [
                { id: "USE_UBER", title: "Trabajo (Uber/Apps)", description: "Mucho uso diario" },
                { id: "USE_FAM", title: "Familiar", description: "Espacio y confort" },
                { id: "USE_FIRST", title: "Primer auto", description: "Economía y mantenimiento" },
                { id: "USE_CARGO", title: "Carga/Trabajo", description: "Robustez" },
                { id: "USE_MIX", title: "Uso mixto", description: "Un poco de todo" },
                { id: "USE_OTHER", title: "Otro", description: "Te asesoro" }
              ]
            }
          ]
        }
      };

    case "WIZ_MODEL":
      return {
        type: "list",
        header: { type: "text", text: "Elegí modelo" },
        body: { text: "Seleccioná el modelo para avanzar 👇" },
        action: {
          button: "Modelos",
          sections: [
            {
              title: "Fiat",
              rows: [
                { id: "MOD_CRONOS", title: "Cronos", description: "Equilibrio y reventa" },
                { id: "MOD_PULSE", title: "Pulse", description: "Compacto y moderno" },
                { id: "MOD_STRADA", title: "Strada", description: "Trabajo y carga" },
                { id: "MOD_TORO", title: "Toro", description: "Pickup premium" },
                { id: "MOD_OTHER", title: "Otro / No sé", description: "Asesorame" }
              ]
            }
          ]
        }
      };

    case "WIZ_VERSION":
      // Reply buttons: máximo 3
      return {
        type: "button",
        body: { text: "¿Qué versión te interesa del modelo? (para recomendarte bien)" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "VER_BASE", title: "Base" } },
            { type: "reply", reply: { id: "VER_INTER", title: "Intermedia" } },
            { type: "reply", reply: { id: "VER_FULL", title: "Full" } }
          ]
        }
      };

    case "WIZ_PAYMENT":
      return {
        type: "button",
        body: { text: "¿Cómo pensás pagar?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "PAY_CASH", title: "Contado" } },
            { type: "reply", reply: { id: "PAY_FIN", title: "Cuotas" } },
            { type: "reply", reply: { id: "PAY_HELP", title: "No sé" } }
          ]
        }
      };

    case "WIZ_TIMING":
      return {
        type: "button",
        body: { text: "¿Cuándo te gustaría avanzar?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "TIM_TODAY", title: "Hoy" } },
            { type: "reply", reply: { id: "TIM_WEEK", title: "Esta semana" } },
            { type: "reply", reply: { id: "TIM_MONTH", title: "Este mes" } }
          ]
        }
      };

    default:
      return null;
  }
}