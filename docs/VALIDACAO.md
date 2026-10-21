# Validação — versão React/TypeScript/Vite — 20/10/2026

## Executado nesta migração

- npm install executado com npm oficial instalado em .local, pois o ambiente tinha Node sem npm no PATH. Dependências e package-lock.json gerados.
- TypeScript strict e verificação sintática do backend aprovados.
- Build Vite de produção aprovado: React e dependências compilados, CSS/JS incluídos no HtmlService, sem dependência de servidor Node nem módulos de mocks/proxy local.
- 33 testes aprovados: 14 de domínio, 5 de serviços TypeScript, 4 de componentes React e 10 do backend com simuladores dos serviços Google.
- Testes React incluem quatro seleções independentes, prevenção de duplicatas, remoção, listagem preservada, tema, ranking independente da ordenação da lista, rota de detalhes e envio manual pela API uma única vez.
- Testes de uploads incluem limites, fragmentação sequencial, assinatura, montagem dos bytes privados, repetição idempotente de parte/recibo, referência vinculada ao ticket e limitação de chamadas.
- Nova leitura HTTP real do CSV: 24 colunas, 140 registros, zero preços inválidos no snapshot; 432 combinações verificadas pelo motor TypeScript. Folia Kids única com Mega e Luxo. Não houve escrita na base.
- Vite acessado no navegador desktop com CSV oficial real via proxy. Confirmados carregamento, tema escuro, rota hash de Folia Kids com Mega/Luxo separados e página própria de contribuição com as duas opções. Envios reais corretamente bloqueados no desenvolvimento local. Registro visual em previa-react-desktop.png.
- Ajuda da versão instalada do clasp consultada para confirmar flags de deploy/redeploy. Não foi executado push ou deploy em conta Google.

## Pendente na conta proprietária

- Login clasp, ID de script real, autorizações e instalação idempotente nos serviços Google.
- Publicação /exec, acesso sem login, RPC de produção e persistência real em Sheets/Drive.
- Upload real de PDF/JPEG/PNG, inclusive três arquivos de 10 MiB; falhas/repetições, cotas e duração da montagem final.
- Verificação externa de que os arquivos e respostas não são acessíveis anonimamente.
- Execução real do gatilho de limpeza e revisão de arquivos órfãos.
- Atualização após alteração autorizada da base pública; falha real da origem e recuperação de backup no Apps Script.
- Revisão visual completa mobile/tablet e acessibilidade. Testes de componentes não substituem essa revisão.

## Limites das evidências

Backend local usa simuladores: testes não comprovam autorização real, cotas ou comportamento do Google em produção. A entrega anterior e seus registros estão em legacy e não representam a validação desta versão. Nenhuma URL pública foi criada nem inventada nesta sessão.


## Ajustes posteriores — várias capacidades no mesmo envio

- Releitura do CSV oficial: confirmadas as duas casas de Niterói para 80 convidados em 2027 e propostas de outros estabelecimentos em 2025/2026. Nenhum dado oficial alterado.
- Testes acrescentados para linhas manuais independentes, remoção sem perda das demais opções, ausência de cálculo proporcional, validação por opção no servidor, migração idempotente da coluna privada, preservação dos registros anteriores e uma única linha Pendente na repetição do envio.
- Teste de regressão confirma que nome, cidade e ano são capturados antes de bloquear os campos; teste da disponibilidade confirma a troca explícita de ano/período sem misturar os registros.
- Conferência no navegador móvel da prévia atualizada em 127.0.0.1:4173: consulta real, tabela de disponibilidade, troca para 2026/fim de semana com quatro casas, formulário com duas linhas (100 e 80 convidados), sem envio real. Registro em previa-multiplas-opcoes.png.
- Limite do comparador, layout principal e rodapé preservados. Backend de produção e migração da planilha privada ainda exigem implantação/validação na conta Google.
- Resultado final deste ciclo: 40 testes aprovados (27 TypeScript/React e 13 backend simulado); TypeScript e build Vite/HtmlService aprovados.

## Regra revisada: referências anteriores quando falta o ano solicitado

- Orientação mais recente do responsável autoriza propostas de anos anteriores na busca do ano da festa, sempre com ano original destacado. Regra implementada: preferência pelo ano solicitado por casa; quando ausente, referência anterior mais recente para convidados/período compatíveis.
- Valores comerciais originais, pagamentos e pacotes permanecem vinculados. Nenhum reajuste, deflação, inflação ou média calculada. Uma proposta mais antiga e barata não substitui outra mais recente elegível da mesma casa.
- 47 testes aprovados: 34 TypeScript/React e 13 backend simulado. Casos novos cobrem preferência de ano, fallback mais recente, exclusão de anos futuros/ausentes, convidados/período exatos, limites de preço e avisos nos cartões, listagem, comparação e detalhes.
- Build TypeScript/Vite/HtmlService aprovado. Nenhuma alteração de backend foi necessária para esta revisão da busca.
- Consulta real do CSV oficial, 140 registros/24 colunas, validada em 432 combinações. Niterói/80/2027: quatro casas de segunda a quinta e dez na seleção de fim de semana, com os anos de origem preservados. Contagens verificadas, não fixadas no código.
- Navegador móvel conferido na prévia aberta: pesquisa para 2027 mostra Espaço Santa Rosa com proposta de 2025 e aviso Valor para 2027 não confirmado junto ao preço. Registro em previa-referencia-anterior.png.
- Publicação Google permanece pendente de autenticação/implantação na conta proprietária.

## Detalhes em pop-up

- 50 testes aprovados (37 TypeScript/React, 13 backend simulado) e build Vite/HtmlService aprovado.
- Testes novos verificam preservação da página da listagem, instância dos resultados, seleção/aba do comparador, foco e rota direta de detalhes.
- Diálogo nativo conferido no navegador móvel com dados reais: abertura sobre a lista, fechar por X, reabrir, fechar por Esc e retorno de foco ao mesmo link. Conteúdo e aviso de referência de 2025 para festa pesquisada em 2027 preservados.
- jsdom utiliza um substituto mínimo de showModal/close nos testes; comportamento nativo foi conferido no navegador. Registro em previa-detalhes-popup.png.

## Pacote de avaliação para Netlify Drop

- Gerado perfil share-preview a partir dos mesmos componentes React e 140 registros consultados do CSV público no momento da geração.
- Build independente aprovado em dist/netlify-preview; ZIP pronto com index.html, assets e preview-data.json. Sem backend .gs, segredos ou planilha privada.
- 52 testes aprovados (39 TypeScript/React e 13 backend simulado). Os dois testes novos validam a leitura da captura pública com aviso de dados não atualizados automaticamente e o bloqueio de envios/arquivos.
- Build principal Apps Script aprovado e verificado sem o adaptador/arquivo de dados da prévia compartilhável.
- Nenhum deploy no Netlify foi executado; o usuário fará o envio da pasta no Drop. O pacote não é uma implantação de produção nem substitui a integração oficial em tempo de execução.

## Contraste dos filtros no tema escuro

- Cores de fundo/texto aplicadas explicitamente a option/optgroup, além do color-scheme dos controles em cada tema. A opção selecionada usa roxo com texto branco.
- Build principal e build share-preview aprovados. ZIP Netlify regenerado mantendo a mesma captura pública de dados.
- Campos da busca conferidos no navegador no tema escuro. A lista nativa foi aberta, mas a captura de tela do navegador não inclui a janela nativa das opções; o registro correcao-contraste-dark.png mostra os controles na página. Nenhuma mudança de regras comerciais.

Comparação facilitada: seleção por checkbox na listagem (até quatro, compartilhada com os seletores), busca por nome em cada posição e botão para abrir o comparativo. Avisos históricos explicam ano buscado e preço sem reajuste. Validação: 40 testes de frontend/domínio e 13 de backend aprovados; build Apps Script aprovado.

Revisão de interação mobile: checkbox nativo com área de toque de 40 × 44 px e indicador visual de 16 px. Desselecionar pela lista e remover no comparativo usam removeSlot compartilhado, compactam as posições e reduzem as colunas até duas. Regressões cobrem cliques reais, 4→3→2, retorno vazio, menu, links, filtros de valor e busca. Suíte e casos adicionais totalizam 60 testes aprovados. Backend validado com mocks; prévia Vercel não envia contribuições reais.
