
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
    public class VeiculosController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly PlacaService _placa;
        public VeiculosController(AppDbContext db, PlacaService placa) { _db = db; _placa = placa; }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] Guid? clienteId = null)
        {
            var q = _db.Veiculos
                .Include(v => v.Cliente) 
                .AsQueryable();

            if (clienteId.HasValue) q = q.Where(v => v.ClienteId == clienteId.Value);

            var list = await q
                .OrderBy(v => v.Placa)
                .Select(v => new VeiculoResponseDto(
                    v.Id,
                    v.Placa,
                    v.Modelo,
                    v.Ano,
                    v.DataInclusao,
                    v.ClienteId,
                    v.Cliente!.Nome
                ))
                .ToListAsync();

            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VeiculoCreateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                if (string.IsNullOrWhiteSpace(dto.Placa))
                    return BadRequest(new { message = "Placa é obrigatória" });

                if (!await _db.Clientes.AnyAsync(c => c.Id == dto.ClienteId))
                    return BadRequest(new { message = "Cliente não encontrado" });

                var (ehValida, mensagemErro) = _placa.ValidarComDetalhes(dto.Placa);
                if (!ehValida) 
                    return BadRequest(new { message = mensagemErro });

                var placa = _placa.Sanitizar(dto.Placa);

                if (await _db.Veiculos.AnyAsync(v => v.Placa == placa)) 
                    return Conflict(new { message = $"Placa {_placa.Formatar(placa)} já está cadastrada" });

                if (dto.Ano.HasValue && (dto.Ano < 1900 || dto.Ano > DateTime.Now.Year + 1))
                    return BadRequest(new { message = "Ano deve estar entre 1900 e " + (DateTime.Now.Year + 1) });

                var v = new Veiculo { 
                    Placa = placa, 
                    Modelo = string.IsNullOrWhiteSpace(dto.Modelo) ? null : dto.Modelo.Trim(), 
                    Ano = dto.Ano, 
                    ClienteId = dto.ClienteId 
                };
                
                _db.Veiculos.Add(v);
                await _db.SaveChangesAsync();
                
                var veiculoCriado = await _db.Veiculos
                    .Include(x => x.Cliente)
                    .FirstOrDefaultAsync(x => x.Id == v.Id);

                var response = new VeiculoResponseDto(
                    veiculoCriado!.Id,
                    veiculoCriado.Placa,
                    veiculoCriado.Modelo,
                    veiculoCriado.Ano,
                    veiculoCriado.DataInclusao,
                    veiculoCriado.ClienteId,
                    veiculoCriado.Cliente!.Nome
                );

                return CreatedAtAction(nameof(GetById), new { id = v.Id }, response);
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, new { message = "Erro ao salvar veículo no banco de dados" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Erro interno do servidor" });
            }
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var v = await _db.Veiculos
                    .Include(x => x.Cliente)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (v == null) 
                    return NotFound(new { message = "Veículo não encontrado" });

                var response = new VeiculoResponseDto(
                    v.Id,
                    v.Placa,
                    v.Modelo,
                    v.Ano,
                    v.DataInclusao,
                    v.ClienteId,
                    v.Cliente?.Nome
                );

                return Ok(response);
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Erro interno do servidor" });
            }
        }

        // BUG propositado: não invalida/atualiza nada no front; candidato deve ajustar no front (React Query) ou aqui (retornar entidade e orientar)
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] VeiculoUpdateDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var v = await _db.Veiculos.FindAsync(id);
                if (v == null) 
                    return NotFound(new { message = "Veículo não encontrado" });

                if (!await _db.Clientes.AnyAsync(c => c.Id == dto.ClienteId))
                    return BadRequest(new { message = "Cliente informado não existe" });

                var (ehValida, mensagemErro) = _placa.ValidarComDetalhes(dto.Placa);
                if (!ehValida) 
                    return BadRequest(new { message = mensagemErro });

                var placa = _placa.Sanitizar(dto.Placa);

                if (await _db.Veiculos.AnyAsync(x => x.Placa == placa && x.Id != id)) 
                    return Conflict(new { message = $"Placa {_placa.Formatar(placa)} já está sendo usada por outro veículo" });

                if (dto.Ano.HasValue && (dto.Ano < 1930 || dto.Ano > DateTime.Now.Year + 1))
                    return BadRequest(new { message = "Ano deve estar entre 1930 e " + (DateTime.Now.Year + 1) });

                if (v.ClienteId != dto.ClienteId)
                    {
                        var transferencia = new VeiculoTransferencia
                        {
                            VeiculoId = id,
                            ClienteAnteriorId = v.ClienteId,
                            ClienteNovoId = dto.ClienteId,
                            Motivo = "Transferência via edição"
                        };
                        _db.VeiculosTransferencias.Add(transferencia);
                    }

                v.Placa = placa;
                v.Modelo = string.IsNullOrWhiteSpace(dto.Modelo) ? null : dto.Modelo.Trim();
                v.Ano = dto.Ano;
                v.ClienteId = dto.ClienteId; // Permite troca de cliente

                await _db.SaveChangesAsync();

                // **CORREÇÃO DO BUG**: Busca o veículo atualizado com dados do cliente
                var veiculoAtualizado = await _db.Veiculos
                    .Include(x => x.Cliente)
                    .FirstOrDefaultAsync(x => x.Id == id);

                var response = new VeiculoResponseDto(
                    veiculoAtualizado!.Id,
                    veiculoAtualizado.Placa,
                    veiculoAtualizado.Modelo,
                    veiculoAtualizado.Ano,
                    veiculoAtualizado.DataInclusao,
                    veiculoAtualizado.ClienteId,
                    veiculoAtualizado.Cliente!.Nome
                );

                return Ok(response);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict(new { message = "Veículo foi modificado por outro usuário. Recarregue os dados e tente novamente" });
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, new { message = "Erro ao atualizar veículo no banco de dados" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Erro interno do servidor" });
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var v = await _db.Veiculos.FindAsync(id);
                if (v == null) 
                    return NotFound(new { message = "Veículo não encontrado" });

                var temFaturas = await _db.FaturasVeiculos.AnyAsync(fv => fv.VeiculoId == id);
                if (temFaturas) 
                    return BadRequest(new { message = "Veículo possui faturas associadas. Não é possível excluir." });

                _db.Veiculos.Remove(v);
                await _db.SaveChangesAsync();
                return NoContent();
            }
            catch (DbUpdateException)
            {
                return StatusCode(500, new { message = "Erro ao excluir veículo do banco de dados" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Erro interno do servidor" });
            }
        }
    }
}
