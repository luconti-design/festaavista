# festa à vista. — React + TypeScript + Vite no Apps Script

O frontend principal permanece React/TypeScript/Vite. O Apps Script serve **o build React**, consulta o CSV oficial e recebe contribuições privadas em Sheets/Drive. Node e npm são ferramentas locais, não servidores de produção.

O diretório recebido continha a entrega anterior em HTML/JavaScript, sem componentes React. Essa implementação foi corrigida: CSS e regras comerciais foram reaproveitados, a interface foi portada para componentes tipados e o backend foi separado. A versão anterior está em `legacy/`, fora do build.

## Desenvolvimento

Node 22.12 ou superior com npm. Vite e clasp são dependências locais do projeto.

```sh
npm install
npm run dev
npm test
npm run check
npm run build
npm run deploy
```

No Vite, o padrão é consultar o CSV oficial por um proxy de desenvolvimento que segue os redirecionamentos do Google. Envios reais são bloqueados localmente. Para testes simulados, copie `.env.example` para `.env.local`, configure `VITE_DATA_MODE=mock` e reinicie o dev server. Uma faixa identifica dados/envios simulados. Os mocks não entram no build de produção, mesmo se essa variável estiver definida durante o build.

## Estrutura

- `src/components/`: busca, cartões, comparação, exploração e layout.
- `src/pages/`: exploração, detalhes e contribuição.
- `src/hooks/`: consulta/revalidação, catálogo, tema e envio.
- `src/services/`: domínio comercial, RPC tipado e upload fragmentado.
- `src/styles/global.css`: estilos, temas e responsividade reaproveitados.
- `src/mocks/`: dados somente para desenvolvimento explícito.
- `apps-script/`: fontes editáveis do backend `.gs` e manifesto.
- `tools/`: build para HtmlService, verificações e publicação por clasp.
- `tests/`: domínio, React, serviços e backend Google simulado.
- `dist/web/`: build intermediário Vite.
- `dist/apps-script/`: único diretório enviado pelo clasp.

Mantenha `src`, `package.json`, `package-lock.json`, `tsconfig.json` e `vite.config.ts`. Não edite `dist`: o build o regenera.

## Build para HtmlService

TypeScript verifica os tipos e Vite compila React/dependências em um bundle JavaScript e CSS único. Assets importados são incorporados como data URLs, e importações dinâmicas ficam no mesmo bundle. `tools/build-apps-script.mjs` gera `Index.html`, `JavaScript.html` e `Styles.html`, copiados com o backend para `dist/apps-script`.

`Code.gs` avalia o template Index e inclui o JS/CSS via HtmlService. Não há servidor Node, CDN de React ou requisições `/assets` em produção. Google Fonts é um aprimoramento opcional, com fallback Georgia/Arial. A verificação do build rejeita mocks e caminhos de assets não empacotados.

React Router usa `HashRouter`: `#/`, `#/casa/...`, `#/contribuir`. A navegação não muda o endpoint `/exec`. Tema persiste em localStorage e filtros públicos em sessionStorage, quando disponíveis.

## Instalação e primeira implantação

1. Crie um projeto na conta proprietária em https://script.google.com/.
2. Copie o **ID do script** em Configurações do projeto. Não é o ID da planilha nem da implantação.
3. Ative a API do Apps Script em https://script.google.com/home/usersettings.
4. Configure e autentique o clasp:

```sh
npm run gas:configure -- SEU_SCRIPT_ID
npm run gas:login
npm run build
npm run gas:push
```

O login usa o fluxo OAuth oficial do Google, feito pelo proprietário. Não inclua `.clasprc.json`, tokens ou segredos no repositório. `.clasp.json`, `.local/` e `.env.local` são ignorados pelo Git. Nenhum ID/credencial de projeto foi inventado nesta entrega.

5. Abra o editor Apps Script, salve e execute **install_**. Autorize Sheets, Drive, consulta externa e criação do gatilho de limpeza. A função pode ser executada pelo editor; o underscore bloqueia chamadas via navegador.
6. A instalação idempotente cria a planilha **Respostas - Contribuições**, uma pasta privada de documentos, outra de uploads temporários, o backup da última base válida e um gatilho diário de limpeza. Não altera a planilha pública original.
7. Execute **verifyInstallation_** e confira os registros de leitura e privacidade.
8. Execute:

```sh
npm run deploy
```

Na primeira execução sem ID de implantação, faz build, push e `clasp deploy`. No editor, confira **Aplicativo da Web → Executar como: Eu → Quem pode acessar: Qualquer pessoa**, inclusive visitantes anônimos. O manifesto declara USER_DEPLOYING/ANYONE_ANONYMOUS, mas políticas do Workspace podem impedir esse acesso.

Alternativa: faça a primeira implantação pelo editor após gas:push. Copie o ID retornado e configure antes das próximas publicações:

```sh
npm run gas:configure -- SEU_SCRIPT_ID SEU_DEPLOYMENT_ID
npm run deploy
```

Com o ID salvo, `deploy` atualiza **a mesma implantação**, preservando a URL `/exec`. Falhas encerram o comando sem informar sucesso. Não foi criada URL pública nesta sessão: não há conta/projeto Google autenticado.

## Serviços e dados

O serviço TypeScript transforma `google.script.run` em Promises tipadas. Produção usa somente RPC; uma falha nunca ativa mocks. O adaptador local só existe com `import.meta.env.DEV`.

Funções RPC públicas: getQuotes, beginContribution, uploadContributionChunk e submitContribution. Administração e funções auxiliares terminam em underscore e não podem ser chamadas pelo navegador.

A fonte editorial é o mesmo CSV oficial do briefing. O backend lê em runtime por cabeçalhos, tolera colunas extras e rejeita resposta vazia/corrompida. Cache de 300 segundos em blocos pequenos; revalidação na página visível e ao voltar à aba. A última base válida é recuperável por até 24 horas durante falhas, com aviso/data. Não há JSON estático como fonte substituta.

Regras preservadas: quantidade exata, ano original da proposta preservado, preço da coluna Valor sem calcular desconto, pagamento vinculado ao valor, identidade explícita sem fuzzy matching, Folia única com pacotes preservados e disclaimer em cotações. `12h` representa almoço, nunca duração. Condições de segunda a domingo não incluem feriados automaticamente.

## Contribuições e upload

Formulário próprio React, sem Google Forms ou login de visitante quando a implantação admite acesso anônimo. Caminhos: documentos (nome/cidade e arquivos obrigatórios) ou manual (nome/cidade/convidados/ano/valor obrigatórios). Ambos exigem veracidade e autorização. E-mail é opcional e privado.

Até três arquivos PDF/JPG/JPEG/PNG de **10 MiB por arquivo**. O navegador envia **partes sequenciais de 256 KiB** (aproximadamente 350 KB base64), uma chamada por vez. Isso evita uma única requisição de aproximadamente 40 MiB para os três anexos.

O backend valida ticket assinado, índices/tamanhos, extensão, MIME e assinatura inicial do conteúdo. Partes ficam privadas; a última chamada monta e valida o arquivo completo, grava-o na pasta privada definitiva e devolve uma referência vinculada ao ticket. O envio da cotação leva somente essas referências, não IDs arbitrários de terceiros.

Há progresso, bloqueio contra múltiplos cliques e confirmação de cada parte. Repetir uma parte ou recibo final é idempotente. Se a confirmação da linha falhar, a tentativa seguinte confirma o mesmo ID, sem criar outra linha. Dados do formulário ficam bloqueados nessa situação para não alterar um envio possivelmente já gravado.

Sessão expira em 30 minutos. Falhas de rede são exibidas e permitem repetir o envio; se expirar ou trocar o arquivo durante uma tentativa, reabra a página de contribuição para uma nova sessão. Partes/arquivos completos órfãos com mais de 24h vão para a lixeira pelo gatilho diário `cleanupStagedUploads_`; arquivos vinculados às respostas são preservados. Não há exclusão permanente automática.

O Google não documenta um limite RPC universal para prometer uploads máximos em qualquer conta. Fragmentar reduz o risco de payload/timeout, mas a montagem final de 10 MiB ainda depende da memória, tempo e cotas do Apps Script. O envio real de três arquivos máximos precisa de teste na implantação antes da abertura pública.

## Moderação privada

O proprietário abre **Respostas - Contribuições** diretamente no Drive. Cada linha tem ID, data, dados, e-mail privado, links privados, status e nota administrativa. Status: Pendente, Em análise, Aprovada, Rejeitada.

Confira os documentos e organize manualmente os preços por capacidade/pacote/ano/condição nas 24 colunas da fonte oficial. Somente uma pessoa autorizada publica na planilha pública. Marcar Aprovada **não publica nada automaticamente**. O aplicativo nunca escreve na planilha pública.

Não compartilhe a pasta ou a planilha de respostas. Recursos com compartilhamento externo são recusados pelo backend. O frontend recebe referências de upload, mas não links de documentos, IDs da planilha/pasta privada ou segredo. Textos são escapados pelo React; contatos usam esquemas permitidos; fórmulas são neutralizadas na gravação. Não há antivírus ou proteção completa contra bots.

## Propriedades privadas do script

A instalação configura CONTRIBUTIONS_SHEET_ID, UPLOADS_FOLDER_ID, STAGING_FOLDER_ID, QUOTES_BACKUP_ID e SUBMISSION_SECRET. Preserve esses IDs para reinstalação idempotente.

Configurações opcionais:

| Chave | Padrão / efeito |
| --- | --- |
| HOURLY_SUBMISSION_LIMIT | 30 tentativas globais de gravação/hora |
| HOURLY_UPLOAD_CHUNK_LIMIT | 400 partes globais/hora, incluindo repetições |
| CONTRIBUTIONS_PAUSED | true suspende envios/partes |

SUBMISSION_RATE e UPLOAD_RATE são contadores internos persistentes protegidos por LockService. Proteções básicas adicionais: honeypot, assinatura de sessão e tempo mínimo. Não há IP confiável disponível em google.script.run. Ajuste os limites às cotas da conta; 400 partes/hora comportam aproximadamente três contribuições com três arquivos máximos, sem repetições.

## Validação e limitações

Confira `docs/VALIDACAO.md`. Testes locais usam simuladores dos serviços Google e não comprovam permissões, upload anônimo ou persistência real. A consulta HTTP real usa a fonte pública sem modificá-la.

Antes de abrir ao público, valide `/exec` em janela anônima, mobile/tablet/desktop, filtros, quatro casas, remoção, tema, formulário manual, anexos e erros. Confira a linha Pendente e privacidade de documentos; teste alteração autorizada da base e revalidação. Nenhuma alteração foi feita na planilha nesta entrega.

Apps Script/Sheets/Drive permitem operar sem contratar hospedagem externa, dentro das cotas e políticas Google. Não há garantia de tráfego ilimitado. Algumas organizações não permitem acesso anônimo. UrlFetchApp não permite timeout customizado por requisição; falhas retornam conforme os limites do serviço. Não há limitação que exija abandonar React: as adaptações são build inline, hash, RPC e upload fragmentado.

## Referências oficiais

- Vite: https://vite.dev/guide/build
- Comunicação e funções privadas: https://developers.google.com/apps-script/guides/html/communication
- Clasp: https://developers.google.com/apps-script/guides/clasp
- Web Apps: https://developers.google.com/apps-script/guides/web
- Cotas: https://developers.google.com/apps-script/guides/services/quotas

## Ajustes: disponibilidade da base e várias opções manuais

A pesquisa mantém correspondência exata de convidados e período. O ano pesquisado é a preferência: se a casa não tem proposta para esse ano, a busca inclui sua referência anterior mais recente, com identificação visível do ano original. A tabela de disponibilidade conta propostas cadastradas para cada ano, sem incluir referências anteriores nessa contagem específica.

Na consulta de 20/10/2026, propostas específicas para Niterói/80 convidados/2027 existem em duas casas (Folia Kids e Quintal de Contos); a busca também inclui outras casas com referências de anos anteriores devidamente identificadas. Para 2026 há três casas em dias de semana e quatro na seleção de fim de semana; para 2025 há cinco no fim de semana. São contagens da consulta, nunca fixadas no código.

O formulário manual permite até 20 opções de convidados e valor total no mesmo envio, com adição e remoção de linhas. Não existe cálculo proporcional automático. Ano, pacote, período e forma de pagamento são comuns às opções; se essas condições forem diferentes, faça outro envio ou esclareça nas observações para revisão humana.

A planilha privada recebe uma única linha Pendente por contribuição. A nova coluna 27, Opções de convidados e valores, contém a lista completa em JSON, preservando cada quantidade ligada ao seu valor. Quando há várias opções, as antigas colunas Convidados e Valor ficam vazias para não sugerir que o primeiro preço se aplica a todas. Quando há uma opção, essas colunas continuam preenchidas. As 26 colunas anteriores e os envios existentes são preservados.

Depois de publicar o backend novo, execute install_ novamente para acrescentar a coluna privada de modo idempotente. A mesma verificação também ocorre antes da gravação de um envio. Nada é acrescentado à planilha pública e a aprovação continua manual. Clientes antigos de uma única opção continuam aceitos pelo servidor.


## Regra atual: referências de anos anteriores

Conforme a orientação mais recente do responsável, pesquisar uma festa em 2027 não exclui casas cujas únicas referências sejam para festas em 2026 ou antes. Para cada casa, convidados e período continuam compatíveis: prioriza propostas do ano escolhido; quando ausentes, usa o ano anterior disponível mais recente e mantém seus pacotes e condições.

O ano da proposta não é trocado pelo ano pesquisado. Exemplo visível no ranking, na lista, no comparador e nos detalhes: Referência para festas em 2026 — Valor para 2027 não confirmado. Valores permanecem exatamente como cadastrados, sem inflação, deflação, interpolação ou média calculada.

Uma casa com proposta de 2027 não é representada por uma proposta de 2025 só porque é mais barata. Propostas de anos futuros e sem ano válido não são usadas como referência anterior. A faixa de preço é aplicada depois da escolha do ano de referência, sem voltar a um ano mais antigo para caber no limite.

## Detalhes em pop-up

Ver detalhes abre um diálogo modal sobre os resultados, com fundo suavizado, rolagem interna e fechamento por X, Esc ou clique fora. A página de resultados permanece montada, preservando paginação, filtros, aba ativa e seleção do comparador. Ao fechar, o foco retorna ao link de origem sem deslocar a lista. O endereço por hash continua disponível e links diretos também abrem os detalhes sobre a página inicial.

## Compartilhar uma prévia pelo Netlify Drop

Use npm run build:share para gerar dist/netlify-preview com a interface React e uma cópia capturada naquele momento do CSV público. Essa é uma demonstração separada: mantém filtros, comparação, temas e pop-ups, mas não atualiza os dados automaticamente e não recebe contribuições nem arquivos. O aviso aparece na interface. O build principal de Apps Script não contém esse adaptador nem a cópia estática.

Para compartilhar: compacte o conteúdo de dist/netlify-preview, extraia o ZIP em seu computador e arraste a pasta que contém index.html, assets e preview-data.json para https://app.netlify.com/drop. Envie ao destinatário o endereço gerado pelo Netlify. Não arraste a pasta raiz do projeto, node_modules ou dist/apps-script. Nenhum login/token do Google é necessário nessa demonstração.

Para atualizar a prévia, gere novamente build:share e envie a nova pasta na área de deploy do mesmo projeto Netlify. A versão principal continua usando o backend Apps Script e o CSV em tempo de execução. A prévia não substitui a implantação principal e nenhuma publicação foi feita automaticamente por estes comandos.
