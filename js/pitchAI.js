// pitchAI.js
// Módulo responsável por gerar um texto persuasivo dinâmico
// baseado nas escolhas do usuário. Utiliza regras simples e
// variação de frases para criar mensagens únicas.

export function generatePitch(data, breakdown, total) {
  const { client, productionType, instruments, services, vocals, notes } = data;
  const namePart = client.name ? `${client.name}, ` : '';
  const intros = [
    `Olá ${namePart}é um prazer receber seu interesse na Vale Produções!`,
    `${namePart}agradecemos por considerar a Vale Produções para o seu projeto musical.`,
    `Seja bem‑vindo(a) à Vale Produções, ${client.name || 'artista'}!`
  ];
  const intro = pickRandom(intros);

  // Texto sobre tipo de produção
  let typeMsg = '';
  switch (productionType) {
    case 'banda':
      typeMsg = 'Produções de banda exigem uma sinergia impecável entre instrumentos e vozes. Nossa equipe possui experiência em capturar a energia coletiva de cada músico, resultando em registros vibrantes e cheios de vida.';
      break;
    case 'solo':
      typeMsg = 'Projetos solo merecem destaque absoluto para o artista. Nós valorizamos cada nuance da sua interpretação, oferecendo arranjos que evidenciam seu talento individual.';
      break;
    case 'instrumental':
      typeMsg = 'Músicas instrumentais precisam de clareza e riqueza de detalhes. Utilizamos equipamentos de ponta e técnicas refinadas para realçar cada timbre e textura.';
      break;
    default:
      typeMsg = 'Independentemente do formato, personalizamos cada produção para refletir sua identidade artística de forma autêntica.';
  }

  // Texto sobre serviço de produção (single ou IA)
  let prodMsg = '';
  if (data.productionService === 'single') {
    prodMsg = 'Optando por uma produção tradicional com voz e base instrumental, oferecemos toda a estrutura necessária para extrair a melhor performance e qualidade de som.';
  } else if (data.productionService === 'ia') {
    prodMsg = 'Com a produção impulsionada por inteligência artificial, combinamos tecnologia de ponta e expertise musical para criar arranjos inovadores e eficientes.';
  }

  // Texto sobre plano de carreira
  let careerMsg = '';
  if (data.careerPlan && data.careerPlan !== 'none') {
    const meses = data.careerPlan.replace('m','');
    careerMsg = `Incluído um plano de gerenciamento de carreira de ${meses} mês(es), cobrindo criação e manutenção de site, gerenciamento de redes sociais e análise de plataformas digitais para que sua presença online seja impactante e profissional.`;
  }

  // Texto sobre instrumentos
  const instrumentMessages = [];
  Object.keys(instruments).forEach((key) => {
    const qty = instruments[key];
    instrumentMessages.push(`
      Para o(s) ${qty} ${pluralize(pricingLabels.instrumentos[key].label, qty)},
      utilizaremos microfones e técnicas específicas para garantir que a sonoridade seja capturada com fidelidade e emoção.`.replace(/\s+/g, ' ').trim()
    );
  });
  const instrumentsMsg = instrumentMessages.join(' ');

  // Texto sobre vocais
  let vocalsMsg = '';
  if (vocals > 0) {
    vocalsMsg = `${vocals} ${vocals === 1 ? 'voz' : 'vozes'} receberá(ão) tratamento especial, com cabine acústica dedicada e acompanhamento de direção vocal para extrair o melhor de cada take.`;
  }

  // Texto sobre serviços selecionados
  const serviceMessages = [];
  services.forEach((srv) => {
    const label = pricingLabels.servicos[srv].label;
    switch (srv) {
      case 'pos_producao':
        serviceMessages.push('Nossa mixagem e masterização profissionais elevarão a sonoridade do seu projeto a padrões internacionais.');
        break;
      case 'gerenciamento_carreira':
        serviceMessages.push('Oferecemos um programa de gerenciamento de carreira que acompanha você em todas as etapas, desde a estratégia de lançamento até a construção de uma marca sólida.');
        break;
      case 'composicao':
        serviceMessages.push('Nossos compositores e arranjadores trabalham em conjunto com você para criar músicas e arranjos originais que se destacam.');
        break;
      case 'design_capa':
        serviceMessages.push('Cuidamos também da criação de uma identidade visual impactante com design de capa profissional.');
        break;
      case 'marketing':
        serviceMessages.push('Nossa equipe de marketing irá posicionar sua obra nas principais plataformas digitais e planejar ações promocionais eficazes.');
        break;
      case 'video_clip':
        serviceMessages.push('Produzimos videoclipes cinematográficos que traduzem a essência da sua música em imagens.');
        break;
      case 'gravacao':
        serviceMessages.push('Realizamos a captação em estúdios equipados com tecnologia de ponta, proporcionando áudio cristalino.');
        break;
      default:
        serviceMessages.push(`O serviço de ${label.toLowerCase()} será executado com o mesmo cuidado e excelência que permeiam todas as etapas de nossos projetos.`);
    }
  });
  const servicesMsg = serviceMessages.join(' ');

  // Observações
  const notesMsg = notes ? `Levaremos em consideração suas observações: ${notes}.` : '';

  // Encerramento
  const closingOptions = [
    'Nossa missão é tornar sua música uma experiência inesquecível. Estamos ansiosos para criar algo extraordinário juntos!',
    'Acreditamos que cada projeto é único. Conte conosco para transformar sua visão em realidade.',
    'Combinamos talento, tecnologia e paixão para entregar resultados que superam expectativas.'
  ];
  const closing = pickRandom(closingOptions);

  // Valor total
  const investmentMsg = `O investimento estimado para este projeto é de ${formatCurrency(total)}. Esse valor reflete a dedicação de profissionais experientes e o uso de equipamentos de alto padrão.`;

  // Juntar tudo
  const paragraphs = [intro, typeMsg, prodMsg, careerMsg, instrumentsMsg, vocalsMsg, servicesMsg, notesMsg, investmentMsg, closing];
  // Filtrar vazios
  const filtered = paragraphs.filter((p) => p && p.trim().length > 0);
  return filtered.join('\n\n');
}

// Auxiliares
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pluralize(text, qty) {
  // extremely simple pluralization: adds 's' if qty > 1
  return qty > 1 ? `${text}s` : text;
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// As pricingConfig is loaded in another module, we need access to labels.
// We'll read them from the DOM at runtime. This is a workaround to avoid
// circular dependencies between modules.
const pricingLabels = {
  instrumentos: {},
  servicos: {}
};

// Populate pricingLabels after DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const resInst = await fetch('data/pricing.json');
    const config = await resInst.json();
    pricingLabels.instrumentos = config.instrumentos;
    pricingLabels.servicos = config.servicos;
    // Merge expansions from localStorage for labels
    const stored = localStorage.getItem('valeExpansions');
    if (stored) {
      const expansions = JSON.parse(stored);
      Object.values(expansions).forEach((exp) => {
        if (exp.instrumentos) Object.assign(pricingLabels.instrumentos, exp.instrumentos);
        if (exp.servicos) Object.assign(pricingLabels.servicos, exp.servicos);
      });
    }
  } catch (e) {
    console.error('Erro ao carregar pricing para pitch AI:', e);
  }
});