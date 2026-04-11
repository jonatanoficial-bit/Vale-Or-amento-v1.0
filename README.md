# Vale Orçamento Pro — v2.0.0

Aplicativo estático em HTML, CSS e JavaScript para gerar propostas comerciais da Vale Produção com uma lógica mais executiva de precificação.

## O que mudou nesta versão

- Reposicionamento do produto: de formulário simples para **gerador de proposta comercial**.
- Tabela de preços recalibrada com referências públicas de mercado e organizada por:
  - pacotes principais
  - projetos maiores
  - pós-produção
  - instrumentos / elementos
  - serviços adicionais
- Três faixas automáticas de decisão:
  - **Piso saudável**
  - **Valor ideal Vale**
  - **Referência premium**
- Condição padrão de pagamento com **70% na aprovação + 30% na entrega**.
- PDF executivo com:
  - número do orçamento
  - validade
  - build e versão
  - narrativa comercial
  - itemização do escopo
  - condição de pagamento
- Painel administrativo com:
  - edição de preços
  - edição de parâmetros comerciais
  - importação e exportação de JSON
  - histórico local de orçamentos
  - gestão de expansões
  - troca de senha

## Estrutura

```text
vale_orcamento_v2_build_20260411-103916/
├── index.html
├── admin.html
├── css/
│   └── style.css
├── js/
│   ├── admin.js
│   ├── dataStore.js
│   ├── main.js
│   ├── pdfGenerator.js
│   └── pitchAI.js
├── data/
│   └── pricing.json
├── dlc/
│   ├── manifest.json
│   └── gospel_ao_vivo.json
└── assets/
    └── logo.svg
```

## Como usar localmente

1. Entre na pasta do projeto.
2. Rode um servidor HTTP simples.

```bash
python3 -m http.server 8080
```

3. Abra `http://localhost:8080`.

## GitHub Pages

Como o projeto é estático, basta publicar todo o conteúdo da pasta na branch principal e ativar GitHub Pages na raiz do repositório.

## Senha padrão da área administrativa

```text
admin123
```

Troque depois do primeiro acesso.

## Observações

- O histórico de orçamentos fica salvo no navegador em `localStorage`.
- A tabela base pode ser sobrescrita pela área administrativa sem mexer nos arquivos originais.
- Expansões adicionadas pelo admin também ficam salvas localmente.
