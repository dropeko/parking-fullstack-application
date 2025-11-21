using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Models;

namespace Parking.Api.Services
{
    public class FaturamentoService
    {
        private readonly AppDbContext _db;
        public FaturamentoService(AppDbContext db) => _db = db;

        public async Task<List<Fatura>> GerarAsync(string competencia, CancellationToken ct = default)
        {
            // competencia formato yyyy-MM
            var part = competencia.Split('-');
            var ano = int.Parse(part[0]);
            var mes = int.Parse(part[1]);
            var ultimoDia = DateTime.DaysInMonth(ano, mes);
            
            var inicioMes = new DateTime(ano, mes, 1, 0, 0, 0, DateTimeKind.Utc);
            var fimMes = new DateTime(ano, mes, ultimoDia, 23, 59, 59, DateTimeKind.Utc);

            var criadas = new List<Fatura>();

            // Buscar todos os veículos que existiam no período
            var veiculos = await _db.Veiculos
                .Where(v => v.DataInclusao <= fimMes) // Criado antes do fim do mês
                .Include(v => v.Cliente)
                .Include(v => v.Transferencias.OrderBy(t => t.DataTransferencia))
                .AsNoTracking()
                .ToListAsync(ct);

            // Mapear histórico de proprietários por veículo
            var faturasPorCliente = new Dictionary<Guid, FaturaCliente>();

            foreach (var veiculo in veiculos)
            {
                var historicoProprietarios = ConstruirHistoricoProprietario(veiculo, inicioMes, fimMes);
                
                foreach (var periodo in historicoProprietarios)
                {
                    var clienteId = periodo.ClienteId;
                    var diasPosse = periodo.Dias;

                    // Verificar se cliente é mensalista
                    var cliente = veiculo.Cliente?.Id == clienteId ? 
                        veiculo.Cliente : 
                        await _db.Clientes.FindAsync(clienteId);

                    if (cliente?.Mensalista != true || cliente.ValorMensalidade <= 0) continue;

                    // Verificar se fatura já existe (idempotência)
                    var faturaExistente = await _db.Faturas
                        .FirstOrDefaultAsync(f => f.ClienteId == clienteId && f.Competencia == competencia, ct);
                    if (faturaExistente != null) continue;

                    // Criar ou atualizar fatura do cliente
                    if (!faturasPorCliente.ContainsKey(clienteId))
                    {
                        faturasPorCliente[clienteId] = new FaturaCliente
                        {
                            ClienteId = clienteId,
                            Cliente = cliente,
                            Competencia = competencia,
                            Veiculos = new List<FaturaVeiculoPeriodo>()
                        };
                    }

                    faturasPorCliente[clienteId].Veiculos.Add(new FaturaVeiculoPeriodo
                    {
                        VeiculoId = veiculo.Id,
                        Dias = diasPosse,
                        PeriodoInicio = periodo.Inicio,
                        PeriodoFim = periodo.Fim
                    });
                }
            }

            // Gerar faturas finais
            foreach (var faturaCliente in faturasPorCliente.Values)
            {
                var valorTotal = CalcularValorProporcional(
                    faturaCliente.Cliente.ValorMensalidade ?? 0m, 
                    faturaCliente.Veiculos, 
                    ultimoDia);

                var observacao = GerarObservacaoDetalhada(faturaCliente.Veiculos, ultimoDia);

                var fatura = new Fatura
                {
                    Competencia = competencia,
                    ClienteId = faturaCliente.ClienteId,
                    Valor = valorTotal,
                    QtdVeiculos = faturaCliente.Veiculos.Count, // Atualizado
                    Observacoes = observacao // Atualizado
                };

                // Adicionar veículos à fatura
                foreach (var veiculoPeriodo in faturaCliente.Veiculos)
                {
                    fatura.Veiculos.Add(new FaturaVeiculo 
                    { 
                        FaturaId = fatura.Id, 
                        VeiculoId = veiculoPeriodo.VeiculoId 
                    });
                }

                _db.Faturas.Add(fatura);
                criadas.Add(fatura);
            }

            await _db.SaveChangesAsync(ct);
            return criadas;
        }

        private List<PeriodoProprietario> ConstruirHistoricoProprietario(Veiculo veiculo, DateTime inicioMes, DateTime fimMes)
        {
            var periodos = new List<PeriodoProprietario>();
            var dataAtual = inicioMes;

            // Proprietário inicial (na criação do veículo)
            var proprietarioAtual = veiculo.ClienteId;

            // Ordenar transferências por data
            var transferencias = veiculo.Transferencias.OrderBy(t => t.DataTransferencia).ToList();

            foreach (var transferencia in transferencias)
            {
                // Se transferência ocorreu antes do mês, apenas atualizar proprietário atual
                if (transferencia.DataTransferencia < inicioMes)
                {
                    proprietarioAtual = transferencia.ClienteNovoId;
                    continue;
                }

                // Se transferência ocorreu depois do mês, parar
                if (transferencia.DataTransferencia > fimMes)
                    break;

                // Calcular período anterior à transferência
                var fimPeriodo = transferencia.DataTransferencia;
                if (dataAtual < fimPeriodo && dataAtual <= fimMes)
                {
                    var fimReal = fimPeriodo > fimMes ? fimMes : fimPeriodo;
                    var dias = (int)(fimReal - dataAtual).TotalDays + 1;

                    periodos.Add(new PeriodoProprietario
                    {
                        ClienteId = proprietarioAtual,
                        Inicio = dataAtual,
                        Fim = fimReal,
                        Dias = dias
                    });

                    dataAtual = fimPeriodo.AddDays(1);
                }

                // Atualizar proprietário
                proprietarioAtual = transferencia.ClienteNovoId;
            }

            // Período final (até o fim do mês)
            if (dataAtual <= fimMes)
            {
                var dias = (int)(fimMes - dataAtual).TotalDays + 1;
                periodos.Add(new PeriodoProprietario
                {
                    ClienteId = proprietarioAtual,
                    Inicio = dataAtual,
                    Fim = fimMes,
                    Dias = dias
                });
            }

            return periodos;
        }

        private decimal CalcularValorProporcional(decimal valorMensal, List<FaturaVeiculoPeriodo> veiculos, int diasMes)
        {
            var totalDias = veiculos.Sum(v => v.Dias);
            return Math.Round((valorMensal * totalDias) / diasMes, 2);
        }

        private string GerarObservacaoDetalhada(List<FaturaVeiculoPeriodo> veiculos, int diasMes)
        {
            var detalhes = veiculos.Select(v => 
                $"Veículo {v.VeiculoId.ToString()[..8]}: {v.Dias} dias ({v.PeriodoInicio:dd/MM} a {v.PeriodoFim:dd/MM})"
            );
            
            var totalDias = veiculos.Sum(v => v.Dias);
            return $"Faturamento proporcional - Total: {totalDias}/{diasMes} dias. Detalhes: {string.Join("; ", detalhes)}";
        }

        // Classes auxiliares
        private class FaturaCliente
        {
            public Guid ClienteId { get; set; }
            public Cliente Cliente { get; set; } = null!;
            public string Competencia { get; set; } = "";
            public List<FaturaVeiculoPeriodo> Veiculos { get; set; } = new();
        }

        private class FaturaVeiculoPeriodo
        {
            public Guid VeiculoId { get; set; }
            public int Dias { get; set; }
            public DateTime PeriodoInicio { get; set; }
            public DateTime PeriodoFim { get; set; }
        }

        private class PeriodoProprietario
        {
            public Guid ClienteId { get; set; }
            public DateTime Inicio { get; set; }
            public DateTime Fim { get; set; }
            public int Dias { get; set; }
        }
    }
}