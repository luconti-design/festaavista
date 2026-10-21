# festa à vista.

Aplicação web em Google Apps Script, com consulta do CSV oficial e contribuições privadas em Google Sheets e Drive. HTML, CSS e JavaScript sem dependências de build e sem IA durante a navegação.

## Estado da entrega

O diretório recebido estava vazio: não existia um site implementado para migrar. A interface foi construída com base nas duas referências fornecidas, preservando marca, composição editorial, cores, temas e comportamento responsivo solicitado. Foram acrescentados período, filtros adicionais e avisos obrigatórios do briefing.

**Não há implantação pública criada nesta entrega.** É necessário executar a instalação e autorizar o projeto na conta proprietária. Testes locais e leitura HTTP do CSV não comprovam funcionamento dentro do Google. Consulte `docs/VALIDACAO.md`.

## Arquivos

- `Code.gs`: aplicação web e três funções públicas de comunicação.
- `Config.gs`: constantes e propriedades.
- `SheetsService.gs`: consulta, interpretação e cache do CSV.
- `DriveService.gs`: validação de anexos e armazenamento privado.
- `ContributionsService.gs`: formulários, sessão assinada, limites e gravação.
- `AdminService.gs`: instalação e verificação exclusivas do editor.
- `Index.html`, `Styles.html`, `Domain.html`, `Client.html`: interface e motor de busca.
- `appsscript.json`: manifesto e permissões.

## Instalação na conta Google

1. Acesse https://script.google.com/ e crie um **Novo projeto**, com o nome `Festa à Vista`.
2. Copie todos os arquivos `.gs` e `.html` da raiz deste projeto. No editor, use **+ → Script** para `.gs` e **+ → HTML** para `.html`. Informe os nomes sem extensão; o editor acrescenta a extensão. Substitua o `Code.gs` inicial.
3. Em **Configurações do projeto**, marque a opção de mostrar `appsscript.json`. Substitua seu conteúdo pelo manifesto entregue. Não copie arquivos de testes, ferramentas ou documentação para o Apps Script.
4. Salve. No editor, selecione e execute `install_`. Autorize o acesso à conta, às planilhas, ao Drive e à consulta externa do Google. Se a função não aparecer no seletor, recarregue o editor após salvar. A função é privada para `google.script.run`, mas pode ser executada no editor pelo proprietário.
5. A instalação cria somente recursos privados novos: pasta `Festa à Vista - Documentos privados`, planilha `Respostas - Contribuições` e arquivo de recuperação da base. Não modifica a planilha original. Executar novamente reutiliza os IDs salvos.
6. Execute `verifyInstallation_`. Confira o registro de execução: quantidade de registros, data da consulta e `stale: false` em uma consulta normal.
7. Vá a **Implantar → Nova implantação → Aplicativo da Web**. Selecione **Executar como: Eu**, e **Quem pode acessar: Qualquer pessoa**, inclusive visitantes sem conta. Confirme a implantação e guarde o endereço terminado em `/exec`.
8. Abra `/exec` em janela anônima, sem login. Faça os testes do checklist abaixo. O endereço `/dev` é para desenvolvimento e não substitui esse teste.

Algumas organizações Google Workspace não permitem aplicativos públicos sem login. Se a opção de acesso anônimo não estiver disponível, o administrador da conta precisa autorizar esse uso ou será necessária uma conta que permita essa implantação. O código não contorna a política da organização.

## Moderação privada

Abra `Respostas - Contribuições` diretamente no seu Drive, autenticado como proprietário. Cada linha contém ID, data, dados informados, e-mail privado, links privados dos documentos e status. Use a coluna `Status` para mudar entre **Pendente**, **Em análise**, **Aprovada** e **Rejeitada**. Use `Nota administrativa` para registrar a conferência.

1. Marque como `Em análise` e abra os documentos privados.
2. Confira autenticidade, dados pessoais, validade, casa, capacidades, anos, pacotes, períodos e pagamento.
3. Organize manualmente os preços em linhas compatíveis com as 24 colunas da base oficial. Um envio pode originar várias linhas. Não transforme `12h` em duração: representa almoço.
4. Somente após essa conferência, publique manualmente na planilha oficial com sua conta autorizada. O aplicativo não escreve nessa planilha.
5. Marque a contribuição como `Aprovada` ou `Rejeitada` e registre a decisão. **Mudar o status não publica nada no site.** Não compartilhe publicamente a planilha de respostas ou a pasta.

Não existe página administrativa pública. Todas as funções internas e administrativas terminam em `_`, bloqueando chamadas via `google.script.run`. O único retorno de uma contribuição é a confirmação, sem links, e-mail, ID da pasta ou da planilha.

## Configurações privadas

Em **Configurações do projeto → Propriedades do script**, a instalação grava:

| Propriedade | Uso |
| --- | --- |
| `CONTRIBUTIONS_SHEET_ID` | Planilha privada de respostas |
| `UPLOADS_FOLDER_ID` | Pasta privada de documentos |
| `QUOTES_BACKUP_ID` | Última base pública válida, em arquivo privado |
| `SUBMISSION_SECRET` | Assinatura da sessão de envio; nunca vai ao navegador |
| `SUBMISSION_RATE` | Contagem por hora, protegida por lock |
| `HOURLY_SUBMISSION_LIMIT` | Opcional; padrão de 30 tentativas de gravação por hora no aplicativo inteiro |
| `CONTRIBUTIONS_PAUSED` | Defina `true` para suspender os envios; remova ou defina `false` para reabrir |

Não apague os IDs e execute a instalação esperando reencontrar os mesmos recursos: os IDs são o vínculo de idempotência. Guarde a propriedade original se precisar recuperar uma instalação.

## Atualização da base e recuperação

O backend lê o CSV oficial com `UrlFetchApp`, e interpreta com `Utilities.parseCsv`, por cabeçalhos. Colunas extras são toleradas. Cabeçalhos obrigatórios ausentes, linhas com largura inválida, HTML, base vazia e resposta sem registros utilizáveis não substituem a base válida.

O cache usa blocos pequenos para respeitar o limite por chave, com validade de 300 segundos. Blocos removidos antecipadamente provocam nova consulta. O navegador reconsulta a cada cinco minutos enquanto visível e ao voltar à página. Novas linhas e opções de filtros vêm da planilha, sem republicar código.

Na falha da origem, utiliza a última base válida por até 24 horas com aviso e data visíveis, sempre tentando a origem novamente quando não há cache. Sem base confiável, mostra erro e botão para tentar novamente. `UrlFetchApp` não permite configurar um timeout por requisição: valem os limites de execução do Apps Script, e o frontend recebe falha quando o serviço a retornar. Não há JSON estático como fonte substituta.

## Envios, privacidade e limites

- Até 3 arquivos por contribuição, 10 MiB (10 × 1024 × 1024 bytes) por arquivo, PDF/JPEG/PNG. Extensão, MIME, assinatura inicial e tamanho são verificados no servidor.
- Arquivos são transportados em base64 por `google.script.run`; isso aumenta o tamanho em aproximadamente um terço. O limite de três arquivos máximos precisa ser verificado na implantação real. Rede, memória e cotas Google podem impedir um envio; o frontend informa falha e permite tentar novamente. Não há alegação de upload de 30 MiB validado em produção.
- Não exige login do visitante quando a implantação permite acesso anônimo. O proprietário autoriza o acesso ao seu Drive e Sheets.
- Sessão assinada expira em 30 minutos; um tempo mínimo de preenchimento e campo invisível reduzem spam simples. O mesmo ID de envio não gera outra linha em uma repetição da requisição.
- O bloqueio visual impede múltiplos cliques; `LockService` serializa as gravações; o limite por hora persiste nas propriedades para resistir à remoção do cache.
- É proteção básica, não CAPTCHA ou identificação por IP. Apps Script não fornece IP confiável nesta comunicação. Ataques distribuídos podem consumir cotas; pause contribuições e ajuste o limite quando necessário.
- Novos arquivos têm nomes gerados e nunca são compartilhados publicamente. A instalação e os envios recusam pasta/planilha com acesso compartilhado. Use recursos de Meu Drive, sem compartilhamentos herdados.
- Strings exibidas são escapadas; contatos só viram links em formatos permitidos. Textos de contribuições são protegidos contra execução de fórmulas na planilha.
- Documentos enviados não passam por antivírus. Confira-os com cautela na moderação. Exclusão/retenção deve ser administrada pelo proprietário; não há rotina de exclusão automática.
- A aplicação não usa serviços pagos. As contas Google possuem cotas de execução, armazenamento e solicitações, sujeitas às condições do Google; esta arquitetura não garante disponibilidade ilimitada.

## Testes locais (Node.js 18 ou superior)

Sem instalação de pacotes:

```powershell
node --test tests/domain.test.cjs tests/backend.test.cjs
node tools/check.cjs
node tools/package.cjs
```

O último comando copia os arquivos implantáveis para `dist/apps-script`. Opcionalmente, use a ferramenta oficial `clasp` já configurada em sua própria conta para enviá-los, sem publicar credenciais. O arquivo `.clasp.json` não é fornecido porque ainda não existe um ID de projeto autorizado.

Para repetir a validação real em PowerShell:

```powershell
$response = Invoke-WebRequest -Uri 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSySx90K2gB-VRRxUKlgp1hRt2IJGVPkd4Jl9vKoihAaj0UrfE8Y13mAE7V2q6PzUgHNQDtTcN6uwm3/pub?gid=1617292525&single=true&output=csv' -UseBasicParsing
$rows = $response.Content | ConvertFrom-Csv
$rows | ConvertTo-Json -Depth 4 -Compress | node tools/verify-live.cjs
```

## Checklist após implantar

- Abra `/exec` sem login em desktop e celular; alterne os temas e verifique menus e diálogos.
- Consulte cidades, convidados exatos, anos e os três períodos; teste filtros adicionais e resultado vazio.
- Adicione quatro casas no comparador, remova e substitua uma; verifique a rolagem horizontal no celular.
- Confira ranking, propostas, Pix/cartão, Folia Kids e almoço na Espoleta contra a planilha.
- Envie uma contribuição manual e outra com PDF, JPEG e PNG sem login. Confira os arquivos privados e a linha `Pendente`.
- Teste falhas de rede, arquivo inválido, tamanho excedido, duplo clique e repetição da requisição.
- Confirme que a pasta, planilha de respostas e documentos não abrem para um visitante anônimo.
- Confirme que marcar `Aprovada` não altera a base pública.
- Para testar atualização, o proprietário pode realizar uma alteração autorizada na planilha e conferir após a revalidação; nenhuma alteração de teste foi feita nesta entrega.

## Atualizar código

Edite os arquivos correspondentes, execute os testes e copie para o mesmo projeto. Em **Implantar → Gerenciar implantações → Editar**, escolha **Nova versão** e implante, preservando o endereço `/exec`. Alterações na planilha não precisam desse procedimento; só alterações de código.

## Referências oficiais

- Comunicação, formulários e funções privadas: https://developers.google.com/apps-script/guides/html/communication
- Implantação web: https://developers.google.com/apps-script/guides/web
- Limites do cache: https://developers.google.com/apps-script/reference/cache/cache
- Cotas: https://developers.google.com/apps-script/guides/services/quotas
