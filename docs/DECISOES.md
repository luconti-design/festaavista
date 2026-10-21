# Decisões — React/Vite no Apps Script

1. A exigência atual de React/TypeScript/Vite substitui a entrega anterior em JavaScript puro. Não havia frontend React no diretório: CSS e domínio foram reaproveitados e portados para componentes tipados. Legacy mantém o histórico fora da publicação.
2. Fontes editáveis em src/ e apps-script/. Dist é gerado, e somente dist/apps-script é enviado pelo clasp. Nunca publicar node_modules, mocks, testes ou credenciais.
3. React é compilado pelo Vite, não substituído por HTML estático. HtmlService serve o bundle inline e o CSS; não há servidor Node em produção. HashRouter evita endpoints adicionais; código de mocks é removido de produção.
4. Fonte editorial única: CSV oficial por cabeçalhos, revalidado a cada cinco minutos. Produção usa RPC; o proxy Vite só atua em desenvolvimento. Não há fallback silencioso para mocks.
5. Regras comerciais mantidas: convidados exatos e ano original preservado (com referência anterior quando necessário), coluna Valor como preço, sem cálculo de desconto; pagamentos vinculados ao registro; agrupamento explícito sem semelhança aproximada; Folia única e pacotes separados; escolar fora do ranking; ausência de informação explícita.
6. Período de fim de semana é união de sábado/domingo/feriado, sempre mostrando condição real. Segunda a domingo não implica feriados. 12h representa almoço, por confirmação do usuário. Duração só vem de expressões explícitas. Observações permanecem integrais.
7. Comparador tem quatro seletores próprios, nenhuma caixa na listagem geral. Dados de casas não elegíveis deixam de ocupar um slot após a busca. Listagem e conteúdo inferior permanecem abaixo do comparador.
8. Upload sequencial em partes de 256 KiB, no máximo 40 por arquivo de 10 MiB. Cada parte é confirmada, e recibos são idempotentes. O arquivo é validado na montagem final e sua referência é vinculada ao ticket. Evita transferir três arquivos em uma única RPC.
9. Backend privado separado, contribuições em nova planilha e arquivos privados. Aprovar é uma decisão de moderação, sem publicação automática. Apenas o responsável estrutura e publica os preços na base oficial.
10. Administração via editor/planilha privada autenticados. Todas as funções administrativas terminam em underscore. Instalação idempotente cria recursos e gatilho diário; uploads órfãos antigos vão para a lixeira sem excluir documentos vinculados.
11. Proteção básica: HMAC, honeypot, tempo mínimo, LockService, neutralização de fórmulas e limites globais persistentes. Sem identificação por IP, antivírus ou promessa contra bots sofisticados. Pode suspender via CONTRIBUTIONS_PAUSED.
12. Publicação depende de OAuth do proprietário, API habilitada e conta que permita acesso anônimo. A arquitetura não exige hospedagem paga, mas cotas Google continuam aplicáveis.
13. Reserva publicitária mantida sem anúncios reais, contas fictícias ou políticas jurídicas inventadas.

## Ajustes de disponibilidade e contribuição

- Nenhuma condição de busca foi relaxada. A baixa contagem de casas de 2027 foi confirmada no CSV; foi acrescentada uma visão de disponibilidade por ano/período com troca explícita dos filtros.
- Até 20 pares de quantidade/valor por contribuição manual, sem interpolação. Condições comuns permanecem em campos únicos e são validadas no servidor.
- Uma linha privada por ID continua garantindo repetição idempotente. A nova coluna 27 preserva a lista integral; migração somente acrescenta a coluna, mantendo os dados anteriores.
- Corrigida a captura dos campos antes de desabilitar o formulário; isso impede que o FormData omita nome/cidade/ano durante o envio.
- Diferenças exclusivamente por Pix/cartão não são descritas como diferenças de dia/horário. As condições comerciais originais continuam preservadas.
- A prévia antiga de #explore foi substituída pela versão React atual e a âncora antiga agora redireciona para a página inicial.

## Regra de ano revisada por orientação expressa do responsável

A exigência anterior de correspondência estrita de ano deixou de valer para a listagem pública. O ano solicitado é prioritário por casa. Sem proposta desse ano para os mesmos convidados/período, usa a referência anterior mais recente. O preço não é reajustado e o ano real fica destacado em todas as apresentações, com aviso de valor não confirmado para o ano pesquisado. A tabela de disponibilidade continua contando registros exatos de cada ano. Não são calculadas médias nem atualizados preços automaticamente.


## Detalhes sobre os resultados

Por preferência expressa do usuário, a rota de detalhes passa a abrir um dialog nativo sobre a página principal. HomePage permanece montada na rota-pai: estados locais de paginação e aba não se perdem. O diálogo mantém o foco e bloqueia a rolagem do fundo, restaura o foco ao fechar e preserva os avisos comerciais e de anos anteriores.

## Prévia de avaliação no Netlify Drop

Foi acrescentado um perfil explícito share-preview, separado da produção Apps Script. O perfil usa uma captura atual dos dados já públicos, sem mocks ou preços simulados, pois google.script.run não está disponível no Netlify. A página mostra aviso de cópia estática e bloqueia contribuições e uploads. O build principal verifica que esse perfil/arquivo de dados não está incluído. O usuário fará o upload da pasta pré-compilada no Drop para obter o link compartilhável.
