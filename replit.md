# Sistema de Gerenciamento de Bicicletário

## Overview
O Sistema de Gerenciamento de Bicicletário (Bicicletário Shop) é uma aplicação web, com versão desktop executável, desenvolvida para gerenciar clientes, bicicletas e controlar o fluxo de entrada e saída em estacionamentos de bicicletas. O objetivo é otimizar as operações de bicicletários através de funcionalidades de cadastro, registro de movimentação, exportação de dados e configurações personalizáveis, visando o mercado de lojas locais.

## Recent Changes

### 2025-11-09: Correção de Formatação na Exibição de Clientes
- **Problema Reportado**: 
  - Nomes apareciam entre aspas duplas na lista: "GABRIEL MELO" ao invés de GABRIEL MELO
  - CPF sem formatação: 13250774375 ao invés de 132.507.743-75
  - Telefone sem formatação: 68945000121 ao invés de (68) 94500-0121
- **Causa**: Dados importados estavam sendo exibidos diretamente sem formatação na interface
- **Solução Implementada**:
  - **js/cadastros/clientes.js** (função renderClientList):
    - Aplicada remoção de aspas duplas do nome: `client.nome.replace(/^"|"$/g, '')`
    - Aplicada formatação de CPF: `Utils.formatCPF(client.cpf)`
    - Aplicada formatação de telefone: `Utils.formatTelefone(client.telefone)` com proteção para null
  - **js/cadastros/bicicletas.js** (painel de detalhes do cliente):
    - Mesmas formatações aplicadas para garantir consistência entre lista e detalhes
    - Proteção para clientes sem telefone (exibe apenas CPF se telefone for vazio)
- **Resultado**:
  - Nomes exibidos sem aspas duplas
  - CPF formatado com pontos e hífen: 000.000.000-00
  - Telefone formatado com parênteses e hífen: (00) 00000-0000
  - Dados armazenados sem formatação (apenas números), formatados apenas na exibição
- **Arquivos modificados**: 
  - `js/cadastros/clientes.js` (linhas 119-120)
  - `js/cadastros/bicicletas.js` (linhas 135-136)
- **Status**: ✅ Implementado, revisado pelo arquiteto e pronto para uso

### 2025-11-09: Correção de Importação/Exportação CSV e Excel
- **Problema Reportado**: 
  - Importação CSV deixava aspas duplas nos nomes e telefones
  - CPF importado sem pontuação (correto internamente, mas confuso visualmente)
  - Exportação CSV não tinha mesmo formato que XLSX (telefone sem formatação)
- **Solução Implementada**:
  - **sanitizeCsvCell()** (nova função): Remove aspas duplas ao redor de valores CSV e decodifica aspas duplas escapadas
  - **readFile()**: Agora usa sanitizeCsvCell para limpar cada célula CSV antes de processar
  - **processImportData()**: Remove caracteres não-numéricos de telefone antes de salvar (armazenamento consistente)
  - **prepareExportData()**: Formata telefone usando Utils.formatTelefone (além do CPF já formatado)
  - **exportToCSV()**: Escapa aspas duplas corretamente (RFC 4180) substituindo " por ""
  - **Proteção contra null/undefined**: Validação para telefones vazios evita crashes na exportação
- **Resultado**:
  - CSV importado: nomes e telefones limpos, sem aspas duplas
  - CSV exportado: formato idêntico ao XLSX (Nome, Telefone formatado (00) 00000-0000, CPF formatado 000.000.000-00)
  - Compatibilidade: aceita CPF com ou sem pontuação na importação
  - Robustez: suporta clientes sem telefone sem quebrar exportação
- **Arquivos modificados**: 
  - `js/configuracao/configuracao.js` (funções: sanitizeCsvCell, readFile, processImportData, prepareExportData, exportToCSV)
- **Status**: ✅ Implementado, revisado pelo arquiteto e testado

### 2025-11-09: Fresh GitHub Import - Replit Environment Setup
- **Ação**: Projeto importado novamente do GitHub e configurado para funcionar corretamente no ambiente Replit
- **Configurações implementadas**:
  - **Workflow**: Configurado `web-server` rodando `python3 server.py` na porta 5000 com output_type=webview
  - **Server Setup**: Python 3.12 SimpleHTTPServer configurado para servir a aplicação em 0.0.0.0:5000
  - **Storage API**: API de armazenamento em arquivos rodando em thread separada na porta 5001 (localhost)
  - **Deployment**: Configurado para autoscale deployment usando `python3 server.py`
  - **.gitignore**: Criado arquivo .gitignore para excluir:
    - Diretório de dados (`dados/`)
    - Cache Python (`__pycache__/`, `*.py[cod]`)
    - Build Electron (`dist/`, `build/`, `*.exe`)
    - Arquivos temporários e de sistema
- **Persistência de Dados**:
  - localStorage como método primário de armazenamento
  - Storage API em arquivos JSON como backup (pasta `dados/navegador/`)
  - Fallback automático entre localStorage e file storage
- **Status**: ✅ Projeto funcionando corretamente no Replit, servidor rodando, interface carregando, pronto para uso e deployment

### 2025-11-08: Contagem de Pernoites no Histórico Organizado
- **Funcionalidade**: Adicionada contagem visual de pernoites ao lado dos registros em cada dia do histórico organizado
- **Implementação**: 
  - Contador de pernoites filtrado dos registros do dia: `registrosDay.filter(r => r.pernoite === true).length`
  - Badge roxo com ícone de lua mostrando quantos pernoites foram registrados
  - Aparece apenas quando há pelo menos 1 pernoite no dia
  - Design responsivo: `bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300`
- **Arquivos modificados**: 
  - `js/configuracao/configuracao.js` (função `renderDays`, linhas 604-630)
- **Status**: ✅ Implementado e funcionando

### 2025-11-08: Correção do Histórico Organizado de Registros
- **Problema**: A funcionalidade "Histórico Organizado de Registros" na aba Configuração não estava carregando os dados corretamente
- **Causa**: As funções `loadStorageSummary()` e `getOrganizedRegistros()` no `storage.js` são assíncronas (retornam Promises), mas estavam sendo chamadas sem `await` em `configuracao.js`, resultando em dados não resolvidos
- **Solução**: Transformada a função `renderHistoricoOrganizado()` em async e adicionado `await` nas chamadas:
  - `const summary = await Storage.loadStorageSummary();`
  - `const organized = await Storage.getOrganizedRegistros();`
- **Arquivos modificados**: 
  - `js/configuracao/configuracao.js` (linha 520-522)
- **Status**: ✅ Corrigido e funcionando corretamente

### 2025-11-07: Sistema de Modais Customizados
- **Problema**: Dialogs nativos do navegador (confirm() e alert()) não seguiam o design do sistema
- **Solução**: Implementado sistema completo de modais customizados com animações suaves
- **Funcionalidade**:
  - Modais de confirmação (substituem confirm())
  - Modais de alerta (substituem alert())
  - Animações de fade-in/out para backdrop
  - Animações de scale para o conteúdo do modal
  - Design consistente com o tema claro/escuro do sistema
  - Duração de transição de 300ms com easing suave
- **Arquivos criados/modificados**:
  - `js/shared/modals.js` (novo arquivo com sistema de modais)
  - `js/registros/registros-diarios.js` (todos os dialogs substituídos)
  - `js/configuracao/configuracao.js` (todos os dialogs substituídos)
  - `style.css` (CSS para animações dos modais)
- **Status**: Implementado e aprovado pelo arquiteto

### 2025-11-07: Nova Funcionalidade - Dropdown de Ações no Dia Seguinte do PERNOITE
- **Problema**: Registros de PERNOITE no dia seguinte não tinham dropdown de ações, dificultando operações diretas
- **Solução**: Implementado dropdown de ações completo para registros de PERNOITE do dia seguinte (aqueles com `registroOriginalId`)
- **Funcionalidade**:
  - No **dia atual** do PERNOITE: Dropdown desabilitado, apenas badge "PERNOITE Ativo" + botão reverter
  - No **dia seguinte**: Dropdown HABILITADO com todas as ações (Registrar Saída, Remover Acesso, Pernoite novamente, Trocar Bicicleta, Adicionar Outra Bike) + badge "PERNOITE Ativo" + botão reverter
- **Arquivos modificados**: 
  - `js/registros/registros-diarios.js` (linhas 614-640)
  - `docs/FUNCIONALIDADE-PERNOITE.md` (atualizado para versão 2.4.0)
- **Status**: Implementado e aprovado pelo arquiteto

### 2025-11-07: Fresh GitHub Import to Replit
- **Ação**: Projeto importado do GitHub e configurado para execução no ambiente Replit
- **Configurações implementadas**:
  - **Workflow**: Python 3.12 HTTP server configurado na porta 5000 com output_type=webview
  - **Storage API**: API de armazenamento em arquivos na porta 5001 (localhost) com fallback automático para localStorage
  - **Deployment**: Configurado como autoscale para produção usando Python 3
  - **.gitignore**: Criado para excluir dados (`dados/`), cache Python (`__pycache__/`, `*.pyc`), build Electron, e arquivos temporários
  - **Host Configuration**: Frontend já configurado para 0.0.0.0:5000, backend API em localhost:5001
- **Arquitetura no Replit**:
  - Frontend: Servido via Python SimpleHTTPServer na porta 5000
  - Backend: Storage API rodando em thread separada na porta 5001
  - Data Storage: Arquivos JSON em `dados/navegador/` com fallback para localStorage
- **Status**: ✅ Projeto totalmente funcional no Replit e pronto para uso

### 2025-11-07: Correção de Bug Crítico no PERNOITE
- **Problema**: Registros marcados como PERNOITE perdiam os metadados (badge, data original, IDs) ao mudar de data ou recarregar a página
- **Causa**: Funções que salvavam dados no Storage não estavam usando `async/await`, causando condições de corrida onde a UI renderizava antes da persistência completar
- **Solução**: Implementado `async/await` em toda a cadeia de chamadas desde os event handlers até `Storage.saveRegistros()`:
  - Tornados async: `handleActionChange`, `handleRegisterSaida`, `handleReverterAcao`, `handleReverterPernoite`
  - Adicionado `await` em todas as funções que modificam registros: `registrarPernoite`, `reverterPernoite`, `registerSaida`, `removerAcesso`, `reverterAcao`, `alterarRegistro`, `adicionarBike`, `handleEditRegistroSubmit`
- **Arquivos modificados**: `js/registros/registros-diarios.js`
- **Status**: Revisado e aprovado pelo arquiteto

## User Preferences
- Idioma: Português (Brasil)
- Aplicação projetada para lojas locais de estacionamento de bicicletas
- Interface com suporte a tema escuro/claro
- Dados separados por plataforma (navegador e desktop) em pastas distintas
- Execução local no computador via navegador

## System Architecture
O sistema adota uma arquitetura modular baseada em Vanilla JavaScript (ES6+ Modules), HTML e CSS, utilizando Tailwind CSS para estilização e Lucide Icons para ícones. A persistência de dados é realizada via LocalStorage ou arquivos JSON, com suporte a um backend de armazenamento em arquivos para a versão web e um sistema de arquivos local para a versão desktop.

-   **UI/UX**:
    -   Interface responsiva com suporte a temas Claro, Escuro e detecção da preferência do sistema operacional.
    -   Modais para edições e confirmações.
    -   Abas de navegação para diferentes módulos (Cadastros, Registros Diários, Configurações).
    -   Feedback visual para ações e seleções.

-   **Módulos Core**:
    -   **Cadastros**: Gerencia clientes (adição, busca, edição com validação de CPF, prevenção de duplicidade) e bicicletas (cadastro múltiplo por cliente, edição, visualização de histórico).
    -   **Registros**: Controla registros diários de entrada/saída, com opções de "Registrar Saída", "Remover Acesso", "Alterar Registro", "Adicionar Outra Bike", e uma funcionalidade de "Pernoite" que gerencia registros estendidos.
    -   **Configuração**: Permite seleção de tema, busca avançada global, importação/exportação de dados (CSV, Excel) e exportação de registros de acesso por cliente (PDF, Excel).
    -   **Shared**: Contém utilitários (formatação, validação de CPF, geração de UUID) e funções para gerenciamento e migração de dados.

-   **Fluxo de Dados**:
    -   Dados armazenados no LocalStorage com estruturas separadas para clientes e registros.
    -   Sistema de "snapshot" para bicicletas no momento da entrada.
    -   Estrutura de pastas separada por plataforma (`dados/navegador/` e `dados/desktop/`) para arquivos JSON de clientes e registros.
    -   A versão desktop utiliza arquivos JSON simplificados (`clientes.json`, `registros.json`) diretamente no diretório `dados/desktop/`.

-   **Versão Desktop (Electron)**:
    -   Aplicações desktop executáveis (`.exe`) construídas com Electron, encapsulando a aplicação web.
    -   Utiliza `electron/storage-backend.js` para gerenciar o armazenamento de arquivos localmente através de IPC handlers.

## External Dependencies
-   **Tailwind CSS**: Framework CSS para estilização.
-   **Lucide Icons**: Biblioteca de ícones.
-   **SheetJS (xlsx)**: Biblioteca para leitura e escrita de arquivos Excel.
-   **LocalStorage**: Para persistência de dados no navegador.
-   **Python 3.12 HTTP Server**: Utilizado para servir a aplicação web e uma API de armazenamento em arquivos (`storage_api.py`) localmente durante o desenvolvimento e execução em ambiente Replit.
-   **Electron**: Framework para construção de aplicações desktop multiplataforma.
-   **Electron Builder**: Ferramenta para empacotamento e distribuição de aplicações Electron.