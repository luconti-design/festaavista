# Registro de validação — 20/10/2026

## Executado

- Leitura HTTP real do CSV oficial: resposta 200, 24 cabeçalhos e 140 registros no momento da consulta. Fonte não foi alterada.
- Motor de busca executado com todos os registros reais, em 432 combinações dos valores existentes de cidade, ano, convidados e período. Verificados unicidade dos estabelecimentos retornados, menor preço elegível e correspondência exata dos filtros.
- 22 testes locais automatizados aprovados: regras de preço, normalização, pacotes, condições, ano, quantidade, períodos, datas, validação de arquivos e consentimentos, assinatura de sessão, injeção de fórmulas, superfície pública e cenários de cache/falha. Inclui execução do caminho de gravação com simuladores, repetição idempotente, limitação por hora e recusa de recursos compartilhados.
- Verificação sintática de todos os `.gs`, scripts HTML e manifesto aprovada com Node.js.
- Prévia HTTP local com os 140 registros reais somente em memória: carregamento confirmado em navegador estreito, troca de tema, comparador inicialmente vazio, seleção e remoção de Folia Kids e abertura dos detalhes com Mega e Luxo. Envios não foram habilitados na prévia. Registro visual em `docs/previa-mobile.png`.
- A revisão estreita identificou necessidade de ajuste no cabeçalho abaixo de 360 px e no fluxo do botão de detalhes; CSS corrigido. Os ajustes finais de CSS e preservação de telefone passaram pela verificação sintática, mas ainda precisam de nova conferência visual.
- Os testes backend usam simuladores dos serviços Google. Eles não provam concessão de permissões nem persistência real no Google.

## Pendente na conta proprietária

- Instalação idempotente com Drive e Sheets reais.
- Implantação pública `/exec` e carregamento de `google.script.run`.
- Envio anônimo manual e de arquivos, inclusive três arquivos de 10 MiB juntos.
- Verificação externa de privacidade dos documentos.
- Teste de mudança autorizada da planilha e revalidação automática em execução real.
- Teste real de interrupção da origem e recuperação do backup no Apps Script.
- Revisão visual completa em desktop/tablet/celular após os ajustes finais; navegação por teclado/leitor de tela. A prévia estreita parcial não substitui essa verificação.
- Verificação de cotas disponíveis na conta proprietária e políticas do domínio.

## Limitações

Não há acesso autorizado nesta sessão ao editor/implantação Apps Script ou ao Drive proprietário. Não foi gerada URL pública e não se considera o sistema validado em produção. O limite de upload e o acesso anônimo são critérios de aceitação ainda pendentes até os testes na implantação real.

O comando `npm` não está disponível no ambiente local; os testes usam `node` diretamente, sem dependências instaladas.
