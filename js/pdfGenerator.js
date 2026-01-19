// pdfGenerator.js
// Módulo para criação do PDF utilizando a biblioteca jsPDF.
// Assume que a biblioteca jsPDF está disponível em window.jspdf (injetada via CDN).

export async function createPDF(data, breakdown, total, pitch) {
  // Carrega a logo como data URL
  const logoData = await loadLogo();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Inserir logo
  if (logoData) {
    doc.addImage(logoData, 'PNG', 10, currentY, 30, 30);
  }
  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Orçamento Personalizado', pageWidth / 2, currentY + 10, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Vale Produções', pageWidth / 2, currentY + 18, { align: 'center' });
  currentY += 35;

  // Seção: Dados do cliente
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Dados do Cliente', 10, currentY);
  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const clientLines = [
    `Nome: ${data.client.name}`,
    `E‑mail: ${data.client.email}`,
    `Telefone: ${data.client.phone || '-'}`
  ];
  clientLines.forEach((line) => {
    doc.text(line, 12, currentY);
    currentY += 5;
  });
  currentY += 2;

  // Seção: Detalhes da produção
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Detalhes da Produção', 10, currentY);
  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Tipo de produção: ${productionTypeLabel(data.productionType)}`, 12, currentY);
  currentY += 5;
  doc.text(`Número de vozes: ${data.vocals}`, 12, currentY);
  currentY += 5;
  // Instrumentos
  const instEntries = Object.entries(data.instruments);
  if (instEntries.length > 0) {
    doc.text('Instrumentos:', 12, currentY);
    currentY += 5;
    instEntries.forEach(([key, qty]) => {
      doc.text(`- ${qty}× ${pricingCache.instrumentos[key].label}`, 16, currentY);
      currentY += 5;
    });
  } else {
    doc.text('Instrumentos: Nenhum', 12, currentY);
    currentY += 5;
  }
  // Serviços
  if (data.services.length > 0) {
    doc.text('Serviços adicionais:', 12, currentY);
    currentY += 5;
    data.services.forEach((srvKey) => {
      doc.text(`- ${pricingCache.servicos[srvKey].label}`, 16, currentY);
      currentY += 5;
    });
  } else {
    doc.text('Serviços adicionais: Nenhum', 12, currentY);
    currentY += 5;
  }
  currentY += 2;

  // Seção: Custos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Resumo de Custos', 10, currentY);
  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  breakdown.forEach((item) => {
    const label = item.label;
    const val = formatCurrency(item.value);
    doc.text(label, 12, currentY);
    doc.text(val, pageWidth - 12, currentY, { align: 'right' });
    currentY += 5;
  });
  // Total
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 12, currentY);
  doc.text(formatCurrency(total), pageWidth - 12, currentY, { align: 'right' });
  currentY += 8;

  // Seção: Texto persuasivo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Mensagem Personalizada', 10, currentY);
  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  // Dividir o texto em linhas para caber na página
  const textWidth = pageWidth - 20;
  const pitchLines = doc.splitTextToSize(pitch, textWidth);
  pitchLines.forEach((line) => {
    if (currentY > 280) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(line, 12, currentY);
    currentY += 5;
  });
  currentY += 6;

  // Data e validade
  const today = new Date();
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const dateStr = today.toLocaleDateString('pt-BR', options);
  const validity = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', options);
  doc.setFont('helvetica', 'bold');
  doc.text('Data de emissão:', 12, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, 45, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Validade da proposta:', 12, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(validity, 60, currentY);
  currentY += 10;

  // Assinatura
  doc.setFont('helvetica', 'italic');
  doc.text('Assinatura (se necessário): ______________________________', 12, currentY);
  currentY += 15;

  // Observações finais
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Este orçamento é uma estimativa e pode variar conforme as necessidades específicas do projeto. Para mais informações, entre em contato conosco.', 12, currentY);

  // Salvar PDF
  doc.save(`orcamento_vale_producoes_${today.getTime()}.pdf`);
}

// Carrega o arquivo de logo e converte para data URL
async function loadLogo() {
  try {
    const response = await fetch('assets/logo.png');
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Logo não encontrada:', e);
    return null;
  }
}

// Helper functions used in PDF generation
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function productionTypeLabel(type) {
  switch (type) {
    case 'banda':
      return 'Banda completa';
    case 'solo':
      return 'Artista solo';
    case 'instrumental':
      return 'Instrumental';
    default:
      return 'Outro';
  }
}

// Keep a simple cache of pricing labels so pdf generator can print them
const pricingCache = {
  instrumentos: {},
  servicos: {}
};

// Load pricing labels once
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data/pricing.json');
    const baseConfig = await res.json();
    pricingCache.instrumentos = baseConfig.instrumentos;
    pricingCache.servicos = baseConfig.servicos;
    // expansions from localStorage
    const stored = localStorage.getItem('valeExpansions');
    if (stored) {
      const expansions = JSON.parse(stored);
      Object.values(expansions).forEach((exp) => {
        if (exp.instrumentos) Object.assign(pricingCache.instrumentos, exp.instrumentos);
        if (exp.servicos) Object.assign(pricingCache.servicos, exp.servicos);
      });
    }
  } catch (e) {
    console.error('Erro ao carregar pricing para PDF:', e);
  }
});