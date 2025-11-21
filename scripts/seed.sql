-- Seed PostgreSQL para o PHCA Parking System
-- Sistema completo de gerenciamento de estacionamento com faturamento proporcional

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpar tabelas na ordem correta (devido às foreign keys)
DROP TABLE IF EXISTS "public"."__EFMigrationsHistory" CASCADE;
DROP TABLE IF EXISTS "public"."veiculo_transferencia" CASCADE;
DROP TABLE IF EXISTS "public"."fatura_veiculo" CASCADE;
DROP TABLE IF EXISTS "public"."fatura" CASCADE;
DROP TABLE IF EXISTS "public"."veiculo" CASCADE;
DROP TABLE IF EXISTS "public"."cliente" CASCADE;

-- ==========================================
-- 1. TABELA CLIENTE
-- ==========================================
CREATE TABLE "public"."cliente"(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone VARCHAR(20),
  endereco VARCHAR(400),
  mensalista BOOLEAN NOT NULL DEFAULT false,
  valor_mensalidade NUMERIC(12,2),
  data_inclusao TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_mensalista_valor CHECK (
    (mensalista = true AND valor_mensalidade > 0) OR 
    (mensalista = false AND valor_mensalidade IS NULL)
  )
);

-- Índices para performance
CREATE INDEX ix_cliente_nome ON "public"."cliente"(nome);
CREATE INDEX ix_cliente_telefone ON "public"."cliente"(telefone) WHERE telefone IS NOT NULL;
CREATE INDEX ix_cliente_mensalista ON "public"."cliente"(mensalista);

-- ==========================================
-- 2. TABELA VEICULO
-- ==========================================
CREATE TABLE "public"."veiculo"(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa VARCHAR(10) NOT NULL UNIQUE, -- Aumentado para suportar Mercosul (ABC1D23)
  modelo VARCHAR(120),
  ano INTEGER,
  data_inclusao TIMESTAMP NOT NULL DEFAULT NOW(),
  cliente_id uuid NOT NULL REFERENCES "public"."cliente"(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT chk_ano_valido CHECK (ano IS NULL OR (ano >= 1900 AND ano <= EXTRACT(YEAR FROM CURRENT_DATE) + 1)),
  CONSTRAINT chk_placa_formato CHECK (
    placa ~ '^[A-Z]{3}[0-9]{4}$' OR  -- Brasil antigo: ABC1234
    placa ~ '^[A-Z]{3}[0-9][A-Z][0-9]{2}$'  -- Mercosul: ABC1D23
  )
);

-- Índices para performance
CREATE INDEX ix_veiculo_cliente_id ON "public"."veiculo"(cliente_id);
CREATE INDEX ix_veiculo_placa ON "public"."veiculo"(placa);
CREATE INDEX ix_veiculo_data_inclusao ON "public"."veiculo"(data_inclusao);

-- ==========================================
-- 3. 🔄 TABELA VEICULO_TRANSFERENCIA (NOVA FUNCIONALIDADE)
-- ==========================================
CREATE TABLE "public"."veiculo_transferencia" (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    veiculo_id uuid NOT NULL,
    cliente_anterior_id uuid NOT NULL,
    cliente_novo_id uuid NOT NULL,
    data_transferencia TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    motivo VARCHAR(500) NULL,
    
    CONSTRAINT "PK_veiculo_transferencia" PRIMARY KEY (id),
    CONSTRAINT "FK_veiculo_transferencia_veiculo_veiculo_id" 
        FOREIGN KEY (veiculo_id) REFERENCES "public"."veiculo"(id) ON DELETE CASCADE,
    CONSTRAINT "FK_veiculo_transferencia_cliente_cliente_anterior_id" 
        FOREIGN KEY (cliente_anterior_id) REFERENCES "public"."cliente"(id) ON DELETE RESTRICT,
    CONSTRAINT "FK_veiculo_transferencia_cliente_cliente_novo_id" 
        FOREIGN KEY (cliente_novo_id) REFERENCES "public"."cliente"(id) ON DELETE RESTRICT,
    
    -- Constraint para evitar transferência para o mesmo cliente
    CONSTRAINT chk_clientes_diferentes CHECK (cliente_anterior_id != cliente_novo_id)
);

-- Índices para performance no faturamento proporcional
CREATE INDEX "IX_veiculo_transferencia_veiculo_id" ON "public"."veiculo_transferencia"(veiculo_id);
CREATE INDEX "IX_veiculo_transferencia_data_transferencia" ON "public"."veiculo_transferencia"(data_transferencia);
CREATE INDEX "IX_veiculo_transferencia_veiculo_id_data_transferencia" ON "public"."veiculo_transferencia"(veiculo_id, data_transferencia);

-- ==========================================
-- 4. TABELA FATURA (Atualizada para novo modelo)
-- ==========================================
CREATE TABLE "public"."fatura"(
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  competencia VARCHAR(7) NOT NULL, -- yyyy-MM
  cliente_id uuid NOT NULL REFERENCES "public"."cliente"(id) ON DELETE CASCADE,
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  qtd_veiculos INTEGER NOT NULL DEFAULT 0, -- Nova coluna
  observacoes TEXT, -- Renomeado de observacao
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(), -- Renomeado de criada_em
  
  -- Constraints
  CONSTRAINT chk_valor_positivo CHECK (valor >= 0),
  CONSTRAINT chk_qtd_veiculos_positiva CHECK (qtd_veiculos >= 0),
  CONSTRAINT chk_competencia_formato CHECK (competencia ~ '^[0-9]{4}-[0-9]{2}$')
);

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX ux_fatura_cliente_competencia ON "public"."fatura"(cliente_id, competencia);

-- Índices para performance
CREATE INDEX ix_fatura_competencia ON "public"."fatura"(competencia);
CREATE INDEX ix_fatura_data_criacao ON "public"."fatura"(data_criacao);

-- ==========================================
-- 5. TABELA FATURA_VEICULO (Mantida para compatibilidade)
-- ==========================================
CREATE TABLE "public"."fatura_veiculo"(
  fatura_id uuid NOT NULL REFERENCES "public"."fatura"(id) ON DELETE CASCADE,
  veiculo_id uuid NOT NULL REFERENCES "public"."veiculo"(id) ON DELETE CASCADE,
  PRIMARY KEY (fatura_id, veiculo_id)
);

-- ==========================================
-- 6. TABELA DE MIGRATIONS (Entity Framework)
-- ==========================================
CREATE TABLE "public"."__EFMigrationsHistory" (
    "MigrationId" VARCHAR(150) NOT NULL,
    "ProductVersion" VARCHAR(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- Marcar migration como aplicada
INSERT INTO "public"."__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20251120230404_AdicionarVeiculoTransferencia', '8.0.0');

-- ==========================================
-- 7. DADOS DE EXEMPLO
-- ==========================================

-- 7.1 Clientes de exemplo
INSERT INTO "public"."cliente"(id, nome, telefone, endereco, mensalista, valor_mensalidade, data_inclusao) VALUES
  ('11111111-1111-1111-1111-111111111111','João Souza','(31) 99999-0001','Rua das Flores, 123 - Belo Horizonte/MG',true,189.90,'2025-07-01'),
  ('22222222-2222-2222-2222-222222222222','Maria Lima','(31) 88888-0002','Av. Afonso Pena, 456 - Centro/BH',false,null,'2025-07-05'),
  ('33333333-3333-3333-3333-333333333333','Carlos Silva','(31) 77777-0003','Rua da Bahia, 789 - Centro/BH',true,159.90,'2025-07-10'),
  ('44444444-4444-4444-4444-444444444444','Ana Paula Santos','(31) 66666-0004','Av. Brasil, 101 - Savassi/BH',false,null,'2025-07-15'),
  ('55555555-5555-5555-5555-555555555555','Beatriz Melo','(31) 55555-0005','Rua Rio de Janeiro, 202 - Centro/BH',true,209.90,'2025-07-20');

-- 7.2 Veículos de exemplo (incluindo cenário de transferência)
INSERT INTO "public"."veiculo"(id, placa, modelo, ano, cliente_id, data_inclusao) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1','BRA1A23','Volkswagen Gol',2019,'11111111-1111-1111-1111-111111111111','2025-07-10'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2','RCH2B45','Chevrolet Onix',2020,'22222222-2222-2222-2222-222222222222','2025-07-15'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3','ABC1D23','Hyundai HB20',2018,'11111111-1111-1111-1111-111111111111','2025-08-01'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4','QWE1Z89','Fiat Argo',2021,'33333333-3333-3333-3333-333333333333','2025-07-20'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5','JKL2M34','Volkswagen Fox',2017,'33333333-3333-3333-3333-333333333333','2025-08-05'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6','ZTB3N56','Honda Civic',2022,'55555555-5555-5555-5555-555555555555','2025-07-01'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7','HGF4P77','Toyota Corolla',2022,'55555555-5555-5555-5555-555555555555','2025-08-20'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8','AAA1111','Fiat Uno',2015,'22222222-2222-2222-2222-222222222222','2025-07-01');

-- 7.3 ✨ Simular transferência no meio do mês (cenário para faturamento proporcional)
-- Transferência do veículo ABC1D23 de João para Maria em 2025-08-18

-- Registrar a transferência na tabela de histórico
INSERT INTO "public"."veiculo_transferencia" 
(id, veiculo_id, cliente_anterior_id, cliente_novo_id, data_transferencia, motivo) VALUES
(uuid_generate_v4(),
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
 '11111111-1111-1111-1111-111111111111', -- João
 '22222222-2222-2222-2222-222222222222', -- Maria
 '2025-08-18 14:30:00',
 'Transferência simulada para demonstração do faturamento proporcional');

-- Atualizar o proprietário atual do veículo
UPDATE "public"."veiculo" 
SET cliente_id = '22222222-2222-2222-2222-222222222222' 
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3';

-- ==========================================
-- 8. VIEWS ÚTEIS PARA RELATÓRIOS
-- ==========================================

-- 8.1 View de veículos com nomes dos clientes
CREATE OR REPLACE VIEW vw_veiculos_detalhados AS
SELECT 
    v.id,
    v.placa,
    v.modelo,
    v.ano,
    v.data_inclusao,
    c.nome as cliente_nome,
    c.mensalista,
    c.valor_mensalidade
FROM "public"."veiculo" v
JOIN "public"."cliente" c ON v.cliente_id = c.id;

-- 8.2 View de transferências detalhadas
CREATE OR REPLACE VIEW vw_transferencias_detalhadas AS
SELECT 
    vt.id,
    v.placa,
    v.modelo,
    ca.nome as cliente_anterior,
    cn.nome as cliente_novo,
    vt.data_transferencia,
    vt.motivo
FROM "public"."veiculo_transferencia" vt
JOIN "public"."veiculo" v ON v.id = vt.veiculo_id
JOIN "public"."cliente" ca ON ca.id = vt.cliente_anterior_id
JOIN "public"."cliente" cn ON cn.id = vt.cliente_novo_id
ORDER BY vt.data_transferencia DESC;

-- ==========================================
-- 9. ✅ VERIFICAÇÃO E RESUMO FINAL
-- ==========================================
DO $$ 
DECLARE
    cliente_count INTEGER;
    veiculo_count INTEGER;
    transferencia_count INTEGER;
    fatura_count INTEGER;
    mensalista_count INTEGER;
    receita_total NUMERIC;
BEGIN
    SELECT COUNT(*) INTO cliente_count FROM "public"."cliente";
    SELECT COUNT(*) INTO veiculo_count FROM "public"."veiculo";
    SELECT COUNT(*) INTO transferencia_count FROM "public"."veiculo_transferencia";
    SELECT COUNT(*) INTO fatura_count FROM "public"."fatura";
    SELECT COUNT(*) INTO mensalista_count FROM "public"."cliente" WHERE mensalista = true;
    SELECT COALESCE(SUM(valor_mensalidade), 0) INTO receita_total FROM "public"."cliente" WHERE mensalista = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ==========================================';
    RAISE NOTICE '    PHCA PARKING SYSTEM - RESUMO DO BANCO';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '👥 Clientes cadastrados: %', cliente_count;
    RAISE NOTICE '🎯 Clientes mensalistas: %', mensalista_count;
    RAISE NOTICE '🚗 Veículos cadastrados: %', veiculo_count;
    RAISE NOTICE '🔄 Transferências registradas: %', transferencia_count;
    RAISE NOTICE '💰 Faturas existentes: %', fatura_count;
    RAISE NOTICE '💵 Receita mensal potencial: R$ %.2f', receita_total;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Banco configurado com sucesso!';
    RAISE NOTICE '🧪 Cenário de teste de faturamento proporcional criado:';
    RAISE NOTICE '   - Veículo ABC1D23 transferido de João para Maria em 18/08';
    RAISE NOTICE '   - Faturamento 2025-08 deve ser proporcional!';
    RAISE NOTICE '';
END $$;

-- ==========================================
-- 10. COMANDOS ÚTEIS PARA DESENVOLVIMENTO
-- ==========================================
/*
-- ✅ Verificar estrutura das tabelas:
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- ✅ Ver todas as transferências:
SELECT * FROM vw_transferencias_detalhadas;

-- ✅ Ver veículos com detalhes:
SELECT * FROM vw_veiculos_detalhados ORDER BY cliente_nome;

-- ✅ Testar cenário de faturamento proporcional:
-- O veículo ABC1D23 deve gerar:
-- - Fatura para João (01/08 a 17/08): 17 dias
-- - Fatura para Maria: NÃO (é avulso)

-- ✅ Comandos para testar a aplicação:
cd src/backend
dotnet run

-- ✅ Endpoints para testar:
GET http://localhost:5000/api/clientes
GET http://localhost:5000/api/veiculos
POST http://localhost:5000/api/faturas/gerar {"competencia": "2025-08"}
GET http://localhost:5000/api/faturas?competencia=2025-08

-- ✅ Testar transferência via API:
PUT http://localhost:5000/api/veiculos/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1
{
  "placa": "BRA1A23",
  "modelo": "Volkswagen Gol",
  "ano": 2019,
  "clienteId": "33333333-3333-3333-3333-333333333333"
}

-- Verificar se transferência foi registrada:
SELECT * FROM vw_transferencias_detalhadas WHERE placa = 'BRA1A23';
*/