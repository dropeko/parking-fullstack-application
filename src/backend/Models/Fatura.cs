
namespace Parking.Api.Models
{
    public class Fatura
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Competencia { get; set; } = ""; // yyyy-MM
        public Guid ClienteId { get; set; }
        public decimal Valor { get; set; }
        public int QtdVeiculos { get; set; } = 0;
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public string? Observacoes { get; set; }

        public List<FaturaVeiculo> Veiculos { get; set; } = new();
    }

    public class FaturaVeiculo
    {
        public Guid FaturaId { get; set; }
        public Guid VeiculoId { get; set; }
    }
}
