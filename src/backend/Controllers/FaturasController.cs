using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Dtos;
using Parking.Api.Models;
using Parking.Api.Services;

namespace Parking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FaturasController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly FaturamentoService _fat;
        private readonly PlacaService _placa;

        public FaturasController(AppDbContext db, FaturamentoService fat, PlacaService placa) 
        { 
            _db = db; 
            _fat = fat; 
            _placa = placa; 
        }

        [HttpPost("gerar")]
        public async Task<IActionResult> Gerar([FromBody] GerarFaturaRequest req, CancellationToken ct)
        {
            try
            {
                var criadas = await _fat.GerarAsync(req.Competencia, ct);
                
                return Ok(new { 
                    criadas = criadas.Count,
                    competencia = req.Competencia,
                    detalhes = criadas.Select(f => new {
                        f.Id,
                        f.ClienteId,
                        f.Valor,
                        veiculos = f.Veiculos.Count,
                        f.Observacoes
                    })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Erro ao gerar faturas",
                    detalhes = ex.Message 
                });
            }
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? competencia = null)
        {
            var q = _db.Faturas
                .Include(f => f.Veiculos)
                .AsQueryable();
                
            if (!string.IsNullOrWhiteSpace(competencia)) 
                q = q.Where(f => f.Competencia == competencia);
                
            var list = await q
                .OrderByDescending(f => f.DataCriacao)
                .Select(f => new {
                    f.Id, 
                    f.Competencia, 
                    f.ClienteId, 
                    f.Valor, 
                    f.DataCriacao,
                    f.Observacoes,
                    qtdVeiculos = f.QtdVeiculos
                })
                .ToListAsync();
                
            return Ok(list);
        }

        [HttpGet("{id:guid}/placas")]
        public async Task<IActionResult> Placas(Guid id)
        {
            var fatura = await _db.Faturas.FindAsync(id);
            if (fatura == null) return NotFound();

            var placas = await _db.FaturasVeiculos
                .Where(x => x.FaturaId == id)
                .Join(_db.Veiculos, fv => fv.VeiculoId, v => v.Id, (fv, v) => new {
                    PlacaOriginal = v.Placa,
                    PlacaFormatada = _placa.Formatar(v.Placa),
                    v.Modelo,
                    v.Ano,
                    VeiculoId = v.Id
                })
                .ToListAsync();
                
            return Ok(new {
                faturaId = id,
                competencia = fatura.Competencia,
                placas = placas.Select(p => new {
                    p.PlacaFormatada,
                    p.Modelo,
                    p.Ano,
                    p.VeiculoId
                })
            });
        }
    }
}