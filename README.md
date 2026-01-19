# Gerador de Orçamento – Vale Produções

Este projeto é um aplicativo **mobile‑first** em HTML, CSS e JavaScript puro que gera orçamentos para a empresa fonográfica **Vale Produções**. Ele coleta informações sobre a produção musical (instrumentos, vozes, serviços adicionais), calcula um valor estimado e gera um PDF profissional com um texto persuasivo adaptado às escolhas do cliente. O código foi concebido para oferecer uma experiência AAA premium e está preparado para receber **expansões (DLCs)** sem alterar o núcleo do sistema.

## 🚀 Funcionalidades Principais

- **Mobile‑first e responsivo**: Interface pensada primeiro para smartphones, adaptando‑se a tablets e desktops.
- **Formulário dinâmico**: Permite selecionar quantidade de instrumentos, número de vozes e serviços adicionais. Novos itens podem ser adicionados via DLCs.
- **Cálculo automático de custos**: Soma os valores de cada item com base em uma tabela de preços configurável.
- **Geração de PDF**: Utiliza a biblioteca [jsPDF](https://github.com/parallax/jsPDF) para gerar um PDF customizado contendo os dados do cliente, detalhes da produção, resumo de custos e um texto persuasivo.
- **Texto persuasivo (IA local)**: Um gerador de mensagens analisa as opções escolhidas e monta uma narrativa única e convincente para valorizar a proposta.
- **Área Administrativa**: Acesso protegido por senha para gerenciar expansões (DLCs) e importar/exportar a tabela de preços.
- **Arquitetura modular**: Pronta para receber expansões de conteúdo (novos instrumentos e serviços) através da pasta `dlc/` ou via Admin, sem alterar o código principal.

## 📁 Estrutura de Pastas

```
vale-app/
├── index.html            # Página principal do gerador de orçamento
├── admin.html            # Área administrativa com login
├── css/
│   └── style.css         # Estilos globais e responsivos
├── js/
│   ├── main.js           # Lógica do formulário, cálculo e interação
│   ├── pitchAI.js        # Gera o texto persuasivo dinâmico
│   ├── pdfGenerator.js   # Constrói o PDF com jsPDF
│   └── admin.js          # Funcionalidades da área administrativa
├── data/
│   └── pricing.json      # Tabela de preços base (instrumentos, vozes e serviços)
├── dlc/
│   ├── manifest.json      # Manifesto que lista DLCs disponíveis
│   └── percussao_exotica.json # Exemplo de expansão (percussões exóticas)
├── assets/
│   └── logo.png          # Logotipo da Vale Produções (placeholder)
└── README.md
```

## 🧑‍💻 Como Rodar Localmente

1. **Clonar ou baixar** este repositório.
2. A pasta `vale-app` já contém todos os arquivos estáticos. Para evitar erros de carregamento devido a políticas de navegador (CORS), recomenda‑se servir os arquivos através de um pequeno servidor HTTP. Você pode usar o Python por exemplo:

   ```bash
   cd vale-app
   python3 -m http.server 8080
   ```

   Após rodar o comando acima, acesse `http://localhost:8080/index.html` no seu navegador.

3. Para testar sem servidor (apenas abrindo o `index.html`), alguns navegadores podem bloquear as requisições de `fetch` a arquivos locais. O aplicativo ainda pode funcionar parcialmente, mas a geração de orçamento pode apresentar falhas. Para a experiência completa, utilize o servidor HTTP como descrito.

## 🔑 Acesso à Área Administrativa

1. Abra `admin.html` (pelo servidor HTTP recomendado).
2. Informe a senha padrão `admin123`. Você pode alterar a senha diretamente no `localStorage` ou adaptando o código.
3. A partir do painel é possível:
   - **Adicionar expansões (DLCs)**: defina um nome e forneça um JSON no formato `{ "instrumentos": { ... }, "servicos": { ... } }`. As expansões são salvas no `localStorage` e serão carregadas na próxima abertura do app.
   - **Remover expansões**: exclui uma DLC anteriormente adicionada.
   - **Exportar tabela de preços**: gera um arquivo JSON com a tabela atual (base + DLCs).
   - **Importar tabela de preços**: substitui a tabela atual pela tabela de um arquivo JSON (armazenado no `localStorage`).

### Formato de Expansão (DLC)

Uma expansão é um objeto JSON que adiciona ou sobrescreve instrumentos e serviços. Exemplo:

```json
{
  "instrumentos": {
    "ukulele": { "label": "Ukulele", "price": 200 },
    "banjo": { "label": "Banjo", "price": 350 }
  },
  "servicos": {
    "aula_canto": { "label": "Aulas de Canto", "price": 300 }
  }
}
```

Adicionando esta DLC via Admin, os campos passam a aparecer automaticamente no formulário do orçamento.

## 📝 Personalização

- **Tabela de Preços**: edite `data/pricing.json` para ajustar valores ou rótulos base. Novas versões podem ser importadas pelo Admin.
- **Logotipo**: substitua `assets/logo.png` pelo logotipo oficial da Vale Produções. Mantenha o mesmo nome do arquivo ou atualize a referência em `index.html` e `admin.html`.
- **Texto Persuasivo**: o módulo `js/pitchAI.js` contém as frases e lógica que compõem a mensagem personalizada. Você pode expandi‑lo com novas estruturas ou ajustes no tom de voz.
- **Novos Campos**: para adicionar novos tipos de entrada (ex.: data de gravação, duração da música), basta editar o HTML e estender a lógica de coleta de dados em `js/main.js`.

## 🧩 DLCs estáticos

O diretório `dlc/` inclui um arquivo `manifest.json` que lista expansões disponíveis. Cada entrada possui um `file` apontando para um JSON com conteúdo. Basta adicionar novos arquivos e atualizar o manifesto para que sejam carregados automaticamente. Este mecanismo facilita a criação de pacotes de conteúdo distribuíveis sem alterar o núcleo do aplicativo.

## 📦 Deploy no GitHub Pages

1. Crie um repositório no GitHub e faça push de todo o conteúdo da pasta `vale-app` para a branch `main`.
2. Nas configurações do repositório, habilite o **GitHub Pages** apontando para a branch `main` (ou para uma branch específica como `gh-pages`) e defina a pasta raiz (`/`).
3. Após alguns minutos, o site estará disponível no endereço fornecido pelo GitHub. Basta acessar o link para utilizar o aplicativo.

## ❗ Observações

- Este projeto utiliza apenas tecnologias web nativas (HTML, CSS, JavaScript) e a biblioteca jsPDF. Nenhum framework foi usado.
- A aplicação foi estruturada para facilitar a manutenção e expansão. Comentários no código orientam possíveis pontos de extensão.
- O texto persuasivo é gerado localmente sem dependência de serviços externos de IA. Ele se baseia em regras e variações pré‑definidas para manter a flexibilidade.

---

**Vale Produções** – Transformando ideias em música de forma profissional e inspiradora.