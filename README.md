# ComprasPage_Sharepoint

Web Part SPFx da area de Compras para a intranet da NR Gourmet.

## Visao Geral

Este projeto implementa uma pagina de Compras com:

- Cards de Acesso Rapido
- Listas e bases disponiveis
- Card lateral do Sistema Genial
- Secao Mais Acessados (pode ser exibida/ocultada por flag)
- Navegacao com links configuraveis

O componente principal esta em `src/webparts/comprasPage/components/IntranetApp.tsx`.

## Tecnologias

- SharePoint Framework (SPFx) `1.20.x`
- React `17.0.1`
- TypeScript `~4.7.4`
- `lucide-react` para icones

## Requisitos

- Node.js `>=18.17.1 <19.0.0`
- npm
- Tenant SharePoint com App Catalog para deploy da solucao

## Instalacao

```bash
npm install
```

## Comandos Principais

```bash
# Build de desenvolvimento
npm run build

# Limpa artefatos
npm run clean

# Testes (se houver)
npm run test
```

Comandos SPFx uteis no dia a dia:

```bash
# Subir ambiente local SPFx
gulp serve

# Gerar pacote para producao
gulp bundle --ship
gulp package-solution --ship
```

## Estrutura Relevante

- `src/webparts/comprasPage/ComprasPageWebPart.ts`
	- Registro da Web Part
	- Property Pane (inclui `linksJson`)
- `src/webparts/comprasPage/components/ComprasPage.tsx`
	- Wrapper que repassa props para o app
- `src/webparts/comprasPage/components/IComprasPageProps.ts`
	- Tipagem das props
- `src/webparts/comprasPage/components/IntranetApp.tsx`
	- UI principal, regras de links e navegacao

## Configuracao de Links (`linksJson`)

A Web Part possui uma propriedade opcional chamada `linksJson` no painel de propriedades.

Objetivo:
- Sobrescrever links padrao sem alterar codigo

Formato esperado:

```json
{
	"quickAccess": {
		"centralArquivos": "https://...",
		"procedimentos": "https://...",
		"comoSolicitar": "https://..."
	},
	"dataBases": {
		"verTodas": "https://...",
		"responsaveisCategoria": "https://...",
		"solicitacoesCompras": "https://...",
		"contratosFornecedores": "https://...",
		"catalogoProdutos": "https://..."
	},
	"sidebar": {
		"sistemaGenial": "https://...",
		"maisAcessados": {
			"politicaCompras2026": "https://...",
			"formularioNovoFornecedor": "https://...",
			"tabelaSlasCategoria": "https://..."
		}
	}
}
```

Observacoes:
- O parse do JSON e protegido com fallback para os links padrao.
- Links externos recebem tratamento para abrir em nova aba.

## Deploy

1. Gerar bundle e pacote:

```bash
gulp bundle --ship
gulp package-solution --ship
```

2. Fazer upload do arquivo `.sppkg` (em `sharepoint/solution`) no App Catalog.
3. Publicar/atualizar a solucao no tenant.
4. Adicionar a Web Part na pagina SharePoint e configurar `linksJson` se necessario.

## Notas

- Aviso conhecido de SCSS:
	- `filename should end with module.sass or module.scss`
	- No estado atual, nao bloqueia o build.

## Versao

- Projeto: `1.0.3`
