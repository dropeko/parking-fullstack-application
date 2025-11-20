
namespace Parking.Api.Dtos
{
    public record VeiculoCreateDto(string Placa, string? Modelo, int? Ano, Guid ClienteId);
    public record VeiculoUpdateDto(string Placa, string? Modelo, int? Ano, Guid ClienteId);
    public record VeiculoDto(
        Guid Id,
        string Placa,
        string? Modelo,
        int? Ano,
        DateTime DataInclusao
    );
    public record VeiculoResponseDto(
    Guid Id,
    string Placa,
    string? Modelo,
    int? Ano,
    DateTime DataInclusao,
    Guid ClienteId,
    string? ClienteNome
    );
}
