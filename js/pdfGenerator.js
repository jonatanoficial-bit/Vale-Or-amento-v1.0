function ensurePage(doc, state, nextHeight = 12) {
  if (state.y + nextHeight <= 280) return;
  doc.addPage();
  state.y = 18;
}

function writeLabelValue(doc, state, label, value, width = 90) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90, 104, 139);
  doc.text(label, 16, state.y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(17, 24, 39);
  const lines = doc.splitTextToSize(value || "-", width);
  doc.text(lines, 16, state.y + 5);
  state.y += 8 + lines.length * 4;
}

export function generateQuotePdf(quote) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const state = { y: 18 };

  doc.setFillColor(10, 17, 32);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(237, 242, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Vale Produção", 16, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Proposta comercial executiva", 16, 25);
  doc.text(`Versão ${quote.meta.version} • Build ${quote.meta.build}`, 16, 31);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(`Orçamento ${quote.number}`, 150, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text(`Emitido em ${quote.issueDate}`, 150, 25, { align: "right" });
  doc.text(`Validade até ${quote.validUntil}`, 150, 31, { align: "right" });

  state.y = 44;
  doc.setDrawColor(222, 226, 235);
  doc.line(16, state.y, 194, state.y);
  state.y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Dados do cliente", 16, state.y);
  state.y += 6;

  const clientLeftStart = state.y;
  writeLabelValue(doc, state, "Cliente", quote.client.name);
  writeLabelValue(doc, state, "Projeto", quote.client.artistName || quote.client.name);
  writeLabelValue(doc, state, "E-mail", quote.client.email);
  const leftEnd = state.y;

  const rightState = { y: clientLeftStart };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(90, 104, 139);
  doc.text("Telefone", 115, rightState.y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(17, 24, 39);
  doc.text(quote.client.phone || "-", 115, rightState.y + 5);
  rightState.y += 13;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(90, 104, 139);
  doc.text("Segmento", 115, rightState.y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(17, 24, 39);
  doc.text(quote.client.segmentLabel, 115, rightState.y + 5);
  rightState.y += 13;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(90, 104, 139);
  doc.text("Origem", 115, rightState.y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(17, 24, 39);
  doc.text(quote.client.salesChannelLabel, 115, rightState.y + 5);

  state.y = Math.max(leftEnd, rightState.y + 10) + 4;
  doc.line(16, state.y, 194, state.y);
  state.y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Escopo do projeto", 16, state.y);
  state.y += 6;

  const scopeLines = [
    `Pacote: ${quote.packageInfo.label}`,
    `Faixas: ${quote.client.songCount} • Tipo: ${quote.client.productionTypeLabel} • Prioridade: ${quote.client.priorityLabel}`,
    `Objetivo: ${quote.client.releaseGoalLabel}`,
    `Vozes: ${quote.client.vocals} • Horas de captação parceira: ${quote.client.partnerStudioHours} • Revisões extras: ${quote.client.revisionRounds}`
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const scopeWrapped = doc.splitTextToSize(scopeLines.join("\n"), 176);
  doc.text(scopeWrapped, 16, state.y);
  state.y += scopeWrapped.length * 5 + 4;

  if (quote.selections.instrumentLabels.length || quote.selections.serviceLabels.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Complementos selecionados", 16, state.y);
    state.y += 6;
    const complementText = [
      quote.selections.instrumentLabels.length ? `Instrumentos / elementos: ${quote.selections.instrumentLabels.join(", ")}` : null,
      quote.selections.serviceLabels.length ? `Serviços adicionais: ${quote.selections.serviceLabels.join(", ")}` : null
    ].filter(Boolean).join("\n");
    const complementWrapped = doc.splitTextToSize(complementText, 176);
    doc.setFont("helvetica", "normal");
    doc.text(complementWrapped, 16, state.y);
    state.y += complementWrapped.length * 5 + 4;
  }

  ensurePage(doc, state, 60);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Composição do investimento", 16, state.y);
  state.y += 8;

  doc.setFillColor(245, 247, 251);
  doc.rect(16, state.y, 178, 8, "F");
  doc.setTextColor(63, 74, 105);
  doc.setFontSize(9);
  doc.text("Item", 18, state.y + 5.5);
  doc.text("Valor", 188, state.y + 5.5, { align: "right" });
  state.y += 11;

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "normal");
  quote.breakdown.forEach((item) => {
    ensurePage(doc, state, 8);
    const lines = doc.splitTextToSize(item.label, 138);
    doc.text(lines, 18, state.y);
    doc.text(item.formattedValue, 188, state.y, { align: "right" });
    state.y += Math.max(6, lines.length * 4 + 2);
    doc.setDrawColor(235, 238, 244);
    doc.line(18, state.y, 188, state.y);
    state.y += 4;
  });

  state.y += 2;
  doc.setFont("helvetica", "bold");
  doc.text(`Perfil selecionado: ${quote.calculations.profileLabel}`, 18, state.y);
  doc.text(quote.calculations.profileValueFormatted, 188, state.y, { align: "right" });
  state.y += 7;
  if (quote.calculations.discount > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Desconto aplicado", 18, state.y);
    doc.text(`- ${quote.calculations.discountFormatted}`, 188, state.y, { align: "right" });
    state.y += 7;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total final", 18, state.y);
  doc.text(quote.calculations.finalTotalFormatted, 188, state.y, { align: "right" });
  state.y += 10;

  doc.setFillColor(237, 242, 255);
  doc.roundedRect(16, state.y, 178, 26, 4, 4, "F");
  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Condição de pagamento sugerida", 20, state.y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  quote.paymentPlan.forEach((line, index) => {
    doc.text(`${line.label}: ${line.value}`, 20, state.y + 14 + index * 5);
  });
  state.y += 34;

  ensurePage(doc, state, 56);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Narrativa executiva", 16, state.y);
  state.y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const pitchLines = doc.splitTextToSize(quote.pitch, 176);
  doc.text(pitchLines, 16, state.y);
  state.y += pitchLines.length * 5 + 4;

  if (quote.client.references || quote.client.notes) {
    ensurePage(doc, state, 32);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Briefing e observações", 16, state.y);
    state.y += 6;
    doc.setFont("helvetica", "normal");
    const briefing = [
      quote.client.references ? `Referências: ${quote.client.references}` : null,
      quote.client.notes ? `Observações: ${quote.client.notes}` : null
    ].filter(Boolean).join("\n");
    const briefingLines = doc.splitTextToSize(briefing, 176);
    doc.text(briefingLines, 16, state.y);
    state.y += briefingLines.length * 5 + 4;
  }

  ensurePage(doc, state, 26);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(90, 104, 139);
  const footerLines = doc.splitTextToSize(`${quote.meta.footerNote} Proposta gerada em ${quote.meta.generatedAt} pelo sistema ${quote.meta.appName}.`, 176);
  doc.text(footerLines, 16, state.y);

  const safeName = (quote.client.artistName || quote.client.name || "cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  doc.save(`${quote.number}_${safeName || "vale-proposta"}.pdf`);
}
