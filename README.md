# 🅿️ PHCA Parking System

Sistema completo de gerenciamento de estacionamento desenvolvido com **.NET 8** e **React**, com recursos avançados de gerenciamento de estacionamento, faturamento proporcional, transferência de veículos e interface de usuário moderna em dark mode.

## 🚀 Funcionalidades Principais

### ✅ Implementadas & Melhoradas

#### 🎯 **Gestão de Clientes**
- ✅ CRUD completo com validações robustas
- ✅ Filtros avançados por nome e tipo (Mensalista/Avulso)
- ✅ Dashboard com métricas em tempo real
- ✅ Validação de mensalidade obrigatória para mensalistas
- ✅ Interface dark mode moderna e responsiva

#### 🚗 **Gestão de Veículos** 
- ✅ CRUD completo com validação de placas Mercosul + formato antigo
- ✅ **Transferência entre clientes** com histórico completo
- ✅ PlacaService robusto (suporta ABC1234 e ABC1D23)
- ✅ Modal de edição com validação em tempo real
- ✅ Filtro por cliente e estatísticas dinâmicas

#### 💰 **Faturamento Proporcional** 
- ✅ **CORREÇÃO CRÍTICA**: Faturamento baseado no proprietário NA DATA, não no atual
- ✅ **Cálculo proporcional**: Considera dias exatos de posse por cliente
- ✅ **Histórico de transferências**: Registra mudanças de proprietário
- ✅ **Observações detalhadas**: Explica períodos e cálculos
- ✅ Dashboard com métricas de faturamento

#### 📤 **Importação de CSV**
- ✅ **Parser CSV robusto**: Suporta vírgulas dentro de campos com aspas
- ✅ **Relatórios detalhados**: Sucessos, erros e avisos por linha específica
- ✅ **Drag & Drop**: Interface moderna com feedback visual
- ✅ **Validação integrada**: Usa PlacaService e validações do backend
- ✅ **Auto-scroll**: Navega automaticamente para resultados

#### 🎨 **Interface & UX**
- ✅ **Dark Mode completo**: Design system moderno e consistente
- ✅ **Responsivo**: Funciona perfeitamente em mobile, tablet e desktop
- ✅ **Navegação intuitiva**: Estados visuais claros para todas as ações
- ✅ **Loading states**: Feedback durante operações
- ✅ **Error handling**: Mensagens específicas e actionable

#### 🛠️ **Melhorias Técnicas**
- ✅ **Validações robustas**: Backend e frontend sincronizados
- ✅ **DTOs padronizados**: Respostas consistentes da API
- ✅ **React Query**: Cache inteligente e invalidação automática
- ✅ **Tratamento de erros**: Try-catch abrangente e mensagens claras
- ✅ **Performance**: Queries otimizadas com includes apropriados

---

## 🏗️ Stack Tecnológica

### Backend (.NET 8)
- **API**: ASP.NET Core Web API
- **ORM**: Entity Framework Core 8
- **Database**: PostgreSQL
- **Validação**: Data Annotations + validações customizadas
- **Arquitetura**: Controllers + Services + DTOs

### Frontend (React)
- **Framework**: React 18 + Vite
- **Roteamento**: React Router v6
- **State Management**: React Query (TanStack Query)
- **Styling**: CSS-in-JS (Dark Mode Theme)
- **Build**: Vite (desenvolvimento rápido)

### Database
- **PostgreSQL**: Banco principal
- **Migrations**: Entity Framework Code First
- **Seeds**: Scripts SQL para dados iniciais

---

## 🚀 Como Executar

### 📋 Pré-requisitos
- **.NET 8 SDK** instalado
- **Node.js 18+** instalado
- **PostgreSQL** rodando localmente
- **Git** para clonar o repositório

### 1. 🗄️ Configurar Banco de Dados

#### Criar banco PostgreSQL:
```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE db_parking;
```

#### Ajustar connection string em `src/backend/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=db_parking;Username=postgres;Password=123"
  }
}
```

#### Executar seed do banco:
```bash
# Para Windows (PowerShell/CMD)
psql -h localhost -U postgres -d db_parking -f scripts/seed.sql

# Para Linux/macOS/WSL
psql -h localhost -U postgres -d db_parking -f scripts/seed.sql
```

### 2. 🔧 Iniciar Backend

```bash
# Navegar para pasta do backend
cd src/backend

# Restaurar dependências
dotnet restore

# Aplicar migrations (se necessário)
dotnet ef database update

# Executar aplicação
dotnet run
```

✅ **API disponível em**: `http://localhost:5000`  
✅ **Swagger/OpenAPI**: `http://localhost:5000/swagger`

### 3. 🎨 Iniciar Frontend

```bash
# Navegar para pasta do frontend (novo terminal)
cd src/frontend

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

✅ **Aplicação disponível em**: `http://localhost:5173`

### 4. 📊 Configurar Variáveis de Ambiente (Opcional)

Criar `.env` em `src/frontend/`:
```env
VITE_API_URL=http://localhost:5173
```

---

## 🧪 Como Testar

### 🎯 Fluxo de Teste Completo

#### 1. **Teste de Clientes**
```bash
# Acessar http://localhost:5173
# 1. Criar cliente mensalista (ex: João Silva, R$ 200/mês)
# 2. Criar cliente avulso (ex: Maria Lima)
# 3. Testar filtros por nome e tipo
# 4. Verificar estatísticas no dashboard
# 5. Editar cliente (trocar de avulso para mensalista)
```

#### 2. **Teste de Veículos**
```bash
# Na página /veiculos:
# 1. Criar veículo com placa antiga: ABC1234
# 2. Criar veículo Mercosul: ABC1D23  
# 3. Testar transferência: editar veículo mudando cliente
# 4. Verificar histórico de transferência (backend registra automaticamente)
```

#### 3. **Teste de Faturamento Proporcional**
```bash
# Na página /faturamento:
# 1. Definir competência (ex: 2024-12)
# 2. Gerar faturas
# 3. Verificar valores proporcionais
# 4. Ver placas de cada fatura
# 5. Testar com transferências no meio do mês
```

#### 4. **Teste de Importação CSV**
```bash
# Na página /csv:
# 1. Usar arquivo scripts/exemplo.csv
# 2. Arrastar arquivo na área de drop
# 3. Verificar relatório detalhado
# 4. Testar arquivo com erros intencionais
# 5. Verificar auto-scroll para resultados
```

### 📊 Cenário Avançado: Faturamento com Transferência

```bash
# Cenário: Veículo ABC1234 transferido no dia 15 do mês
# Cliente A: 01-15 (15 dias) = (200 × 15) ÷ 30 = R$ 100,00  
# Cliente B: 16-30 (15 dias) = (180 × 15) ÷ 30 = R$ 90,00

# 1. Criar Cliente A (mensalista R$ 200)
# 2. Criar Cliente B (mensalista R$ 180)  
# 3. Criar veículo ABC1234 para Cliente A
# 4. No dia 15: editar veículo, trocar para Cliente B
# 5. Gerar faturamento do mês
# 6. Verificar: 2 faturas proporcionais criadas
```

---

## 📁 Estrutura do Projeto

```
📁 teste-fullstack/
├── 📁 src/
│   ├── 📁 backend/              # .NET 8 Web API
│   │   ├── 📁 Controllers/      # Endpoints da API
│   │   ├── 📁 Data/            # DbContext e configurações
│   │   ├── 📁 Dtos/            # Data Transfer Objects
│   │   ├── 📁 Models/          # Entidades do banco
│   │   ├── 📁 Services/        # Lógica de negócio
│   │   └── 📁 Migrations/      # Scripts do EF Core
│   │
│   └── 📁 frontend/            # React + Vite
│       ├── 📁 src/
│       │   ├── 📁 pages/       # Componentes de página
│       │   ├── 📄 api.js       # Cliente HTTP
│       │   ├── 📄 main.jsx     # Layout principal + roteamento
│       │   └── 📄 styles.css   # Estilos globais dark mode
│       └── 📄 package.json
│
├── 📁 scripts/
│   ├── 📄 seed.sql            # Dados iniciais
│   └── 📄 exemplo.csv         # Arquivo para teste de importação
│
└── 📄 README.md               # Este arquivo
```

---

## 🔧 APIs Principais

### Clientes
- `GET /api/clientes` - Listar com filtros
- `POST /api/clientes` - Criar novo
- `PUT /api/clientes/{id}` - Atualizar
- `DELETE /api/clientes/{id}` - Remover

### Veículos  
- `GET /api/veiculos` - Listar (filtro por cliente)
- `POST /api/veiculos` - Criar novo
- `PUT /api/veiculos/{id}` - **Atualizar + transferir cliente**
- `DELETE /api/veiculos/{id}` - Remover

### Faturamento
- `POST /api/faturas/gerar` - **Gerar faturamento proporcional**
- `GET /api/faturas` - Listar faturas por competência  
- `GET /api/faturas/{id}/placas` - Ver veículos da fatura

### Importação
- `POST /api/import/csv` - **Importar CSV com relatório detalhado**

---

## 🐛 Problemas Corrigidos

### ✅ **Bug Crítico: Faturamento**
- **ANTES**: Usava proprietário ATUAL do veículo
- **DEPOIS**: Usa proprietário NA DATA específica do período
- **IMPACTO**: Faturamento agora é 100% preciso com transferências

### ✅ **Bug: Parser CSV**  
- **ANTES**: Quebrava com vírgulas nos endereços
- **DEPOIS**: Parser robusto que respeita aspas e campos complexos

### ✅ **Bug: Validação de Placas**
- **ANTES**: Apenas formato antigo (ABC1234)  
- **DEPOIS**: Suporte completo Mercosul (ABC1D23) + antigo

### ✅ **Bug: Cache do Frontend**
- **ANTES**: Dados desatualizados após edições
- **DEPOIS**: React Query invalida automaticamente caches relacionados

---

## 🎨 Highlights da Interface

- 🌚 **Dark Mode Completo**: Design moderno e profissional
- 📱 **Responsivo**: Funciona perfeitamente em qualquer device
- ⚡ **Performance**: Loading states e feedback imediato
- 🎯 **UX Intuitiva**: Estados visuais claros e navegação fluida
- 📊 **Dashboards**: Métricas em tempo real em todas as páginas
- 🔍 **Filtros Avançados**: Busca inteligente em todas as listagens

---

## 👨‍💻 Desenvolvido por

**PHCA.dev** - Sistema completo de gerenciamento de estacionamento com faturamento proporcional e interface moderna.

**Stack**: .NET 8 + React + PostgreSQL + Entity Framework + React Query  
**Features**: Transferência de veículos, faturamento proporcional, importação CSV, dark mode UI

