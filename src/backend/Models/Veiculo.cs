
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Parking.Api.Models
{
    public class Veiculo
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        [Required, MaxLength(8)] public string Placa { get; set; } = string.Empty;
        [MaxLength(120)] public string? Modelo { get; set; }
        public int? Ano { get; set; }
        public DateTime DataInclusao { get; set; } = DateTime.UtcNow;

        [Required] public Guid ClienteId { get; set; }
        public Cliente? Cliente { get; set; }
        public List<VeiculoTransferencia> Transferencias { get; set; } = new();
    }

        public class VeiculoTransferencia
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid VeiculoId { get; set; }
        public Guid ClienteAnteriorId { get; set; }
        public Guid ClienteNovoId { get; set; }
        public DateTime DataTransferencia { get; set; } = DateTime.UtcNow;
        public string? Motivo { get; set; }

        public Veiculo Veiculo { get; set; } = null!;
        public Cliente ClienteAnterior { get; set; } = null!;
        public Cliente ClienteNovo { get; set; } = null!;
    }
}
