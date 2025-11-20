
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Dtos;
using Parking.Api.Models;

namespace Parking.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ClientesController(AppDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] int pagina = 1, [FromQuery] int tamanho = 10, [FromQuery] string? filtro = null, [FromQuery] string mensalista = "all")
        {
            var q = _db.Clientes.AsQueryable();
            if (!string.IsNullOrWhiteSpace(filtro))
                q = q.Where(c => c.Nome.Contains(filtro));
            if (mensalista == "true") q = q.Where(c => c.Mensalista);
            if (mensalista == "false") q = q.Where(c => !c.Mensalista);

            var total = await q.CountAsync();
            var itens = await q
                .OrderBy(c => c.Nome)
                .Skip((pagina - 1) * tamanho)
                .Take(tamanho)
                .Select(c => new
                {
                    c.Id,
                    c.Nome,
                    c.Telefone,
                    c.Endereco,
                    c.Mensalista,
                    c.ValorMensalidade,
                    c.DataInclusao,
                    QuantidadeVeiculos = c.Veiculos.Count(),
                    Veiculos = c.Veiculos.Select(v => new
                    {
                        v.Id,
                        v.Placa,
                        v.Modelo,
                        v.Ano,
                        v.DataInclusao
                    }).ToList()
                })
                .ToListAsync();
            return Ok(new { total, itens });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ClienteCreateDto dto)
        {
            var existe = await _db.Clientes.AnyAsync(c => c.Nome == dto.Nome && c.Telefone == dto.Telefone);
            if (existe) return Conflict("Cliente já existe.");

            var c = new Cliente
            {
                Nome = dto.Nome,
                Telefone = dto.Telefone,
                Endereco = dto.Endereco,
                Mensalista = dto.Mensalista,
                ValorMensalidade = dto.ValorMensalidade,
            };
            _db.Clientes.Add(c);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = c.Id }, c);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var c = await _db.Clientes
                .Include(x => x.Veiculos)
                .FirstOrDefaultAsync(x => x.Id == id);
            
            if (c == null) return NotFound();

            var response = new ClienteResponseDto(
                c.Id,
                c.Nome,
                c.Telefone,
                c.Endereco,
                c.Mensalista,
                c.ValorMensalidade,
                c.DataInclusao,
                c.Veiculos.Select(v => new VeiculoDto(
                    v.Id,
                    v.Placa,
                    v.Modelo,
                    v.Ano,
                    v.DataInclusao
                )).ToList()
            );

            return Ok(response);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ClienteUpdateDto dto)
        {
            var c = await _db.Clientes.FindAsync(id);
            if (c == null) return NotFound();
            c.Nome = dto.Nome;
            c.Telefone = dto.Telefone;
            c.Endereco = dto.Endereco;
            c.Mensalista = dto.Mensalista;
            c.ValorMensalidade = dto.ValorMensalidade;
            await _db.SaveChangesAsync();
            return Ok(c);
        }


        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var c = await _db.Clientes.FindAsync(id);
            if (c == null) return NotFound();
            var temVeiculos = await _db.Veiculos.AnyAsync(v => v.ClienteId == id);
            if (temVeiculos) return BadRequest("Cliente possui veículos associados. Transfira ou remova antes.");
            _db.Clientes.Remove(c);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
