export function buildPitch(quote) {
  const { client, packageInfo, calculations, selections } = quote;
  const lines = [];

  lines.push(`Preparamos esta proposta para ${client.artistName || client.name} com foco em ${describeGoal(client.releaseGoal)}.`);
  lines.push(`O pacote ${packageInfo.label} foi escolhido porque entrega ${packageInfo.description.toLowerCase()}`);

  if (selections.instrumentLabels.length) {
    lines.push(`O arranjo considera elementos como ${humanList(selections.instrumentLabels.slice(0, 4))}, elevando identidade e percepção de valor do fonograma.`);
  }

  if (selections.serviceLabels.length) {
    lines.push(`Também incluímos ${humanList(selections.serviceLabels.slice(0, 4))}, fortalecendo acabamento e prontidão de lançamento.`);
  }

  if (client.priorityLevel !== "normal") {
    lines.push(`Como o projeto pede tratamento ${client.priorityLevel === "express" ? "expresso" : "prioritário"}, a proposta já considera a reserva de agenda e compressão de prazo.`);
  }

  lines.push(`A recomendação principal da Vale é trabalhar no valor ideal de ${calculations.idealFormatted}, preservando qualidade técnica, margem saudável e capacidade de execução consistente.`);
  lines.push("A condição padrão sugerida é 70% na aprovação e 30% na entrega final, protegendo agenda, caixa do projeto e previsibilidade operacional.");

  return lines.join(" ");
}

function describeGoal(goal) {
  switch (goal) {
    case "catalogo":
      return "fortalecer catálogo e gerar ativo fonográfico";
    case "portfolio":
      return "posicionamento e portfólio profissional";
    case "evento":
      return "um lançamento ligado a ocasião especial";
    default:
      return "um lançamento estratégico com potencial de marca";
  }
}

function humanList(items) {
  if (items.length <= 1) return items[0] || "serviços estratégicos";
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}
