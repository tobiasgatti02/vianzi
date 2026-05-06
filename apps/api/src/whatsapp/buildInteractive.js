// buildInteractive.js
// Named export (import { buildInteractive } ...)

export function buildInteractive(intent, session = {}) {
  switch (intent) {
    // ====== Nombre: confirmación (máx 3 botones) ======
    case "ASK_NAME_CONFIRM": {
      const cand = session.customerNameCandidate || session.customerName || "así";
      // Recomendación: evitá nombres fijos tipo "Joaquin" y usá marca/asesor dinámico si querés
      return {
        type: "button",
        body: { text: `Hola 👋 Soy el asistente de Fiat. ¿Te llamás ${cand}?` },
        action: {
          buttons: [
            { type: "reply", reply: { id: "NAME_YES", title: "Sí" } },
            { type: "reply", reply: { id: "NAME_NO", title: "No" } },
            { type: "reply", reply: { id: "NAME_SKIP", title: "Prefiero no decir" } }
          ]
        }
      };
    }

    // ====== Paso 1: Uso (LIST: header <= 60, body largo) ======
    case "WIZ_USE_CASE": {
      const nombre =
        session?.customerName
          ? `, ${session.customerName}`
          : session?.customerNameCandidate
            ? `, ${session.customerNameCandidate}`
            : "";

      return {
        type: "list",
        header: { type: "text", text: "Uso del vehículo" }, // corto por límite de header [3](https://hello.doclang.workers.dev/midnight-https-learn.microsoft.com/en-us/windows/wsl/install)[2](https://www.youtube.com/watch?v=ig9_tWL3ZGI)
        body: { text: `Perfecto${nombre}. ¿Qué tipo de uso le vas a dar al vehículo?` },
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
    }

    // ====== Paso 2: Modelo (LIST) ✅ FALTABA ======
    case "WIZ_MODEL": {
      const nombre =
        session?.customerName
          ? `, ${session.customerName}`
          : session?.customerNameCandidate
            ? `, ${session.customerNameCandidate}`
            : "";

      return {
        type: "list",
        header: { type: "text", text: "Elegí modelo" }, // corto [3](https://hello.doclang.workers.dev/midnight-https-learn.microsoft.com/en-us/windows/wsl/install)[2](https://www.youtube.com/watch?v=ig9_tWL3ZGI)
        body: { text: `Genial${nombre}. Elegí el modelo para avanzar 👇` },
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
    }

    // ====== Paso 2.5: Versión (máx 3 botones) ====== [1](https://learn.microsoft.com/en-us/windows/wsl/install)[2](https://www.youtube.com/watch?v=ig9_tWL3ZGI)
    case "WIZ_VERSION":
      return {
        type: "button",
        body: { text: "¿Qué versión te interesa del modelo?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "VER_BASE", title: "Base" } },
            { type: "reply", reply: { id: "VER_INTER", title: "Intermedia" } },
            { type: "reply", reply: { id: "VER_FULL", title: "Full" } }
          ]
        }
      };

    // ====== Paso 3: Pago (máx 3 botones) ====== [1](https://learn.microsoft.com/en-us/windows/wsl/install)[2](https://www.youtube.com/watch?v=ig9_tWL3ZGI)
    case "WIZ_PAYMENT":
      return {
        type: "button",
        body: { text: "¿Cómo pensás comprar?" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "PAY_CASH", title: "Contado" } },
            { type: "reply", reply: { id: "PAY_FIN", title: "Cuotas" } },
            { type: "reply", reply: { id: "PAY_HELP", title: "No sé" } }
          ]
        }
      };

    // ====== Paso 4: Urgencia (máx 3 botones) ====== [1](https://learn.microsoft.com/en-us/windows/wsl/install)[2](https://www.youtube.com/watch?v=ig9_tWL3ZGI)
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