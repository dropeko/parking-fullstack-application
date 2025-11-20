using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Parking.Api.Data;
using Parking.Api.Models;
using Parking.Api.Services;
using System.Text;

namespace Parking.Api.Controllers
{
    [ApiController]
    [Route("api/import")]
    public class ImportController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly PlacaService _placa;
        
        public ImportController(AppDbContext db, PlacaService placa) 
        { 
            _db = db; 
            _placa = placa; 
        }

        [HttpPost("csv")]
        public async Task<IActionResult> ImportCsv()
        {
            if (!Request.HasFormContentType || Request.Form.Files.Count == 0)
                return BadRequest(new { message = "Envie um arquivo CSV no campo 'file'." });

            var file = Request.Form.Files[0];
            
            // Validações do arquivo
            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Arquivo deve ter extensão .csv" });
                
            if (file.Length == 0)
                return BadRequest(new { message = "Arquivo está vazio" });
                
            if (file.Length > 5 * 1024 * 1024) // 5MB
                return BadRequest(new { message = "Arquivo muito grande. Máximo 5MB" });

            try
            {
                using var stream = file.OpenReadStream();
                using var reader = new StreamReader(stream, Encoding.UTF8);

                var resultado = await ProcessarCsv(reader);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Erro interno ao processar arquivo", 
                    detalhes = ex.Message 
                });
            }
        }

        private async Task<object> ProcessarCsv(StreamReader reader)
        {
            int linhaAtual = 0;
            int processados = 0;
            int clientesInseridos = 0;
            int veiculosInseridos = 0;
            var erros = new List<object>();
            var avisos = new List<object>();
            var sucessos = new List<object>();

            // Ler e validar cabeçalho
            string? header = await reader.ReadLineAsync();
            linhaAtual++;

            if (string.IsNullOrWhiteSpace(header))
            {
                return new { 
                    erro = "Arquivo CSV vazio ou sem cabeçalho",
                    processados = 0,
                    inseridos = new { clientes = 0, veiculos = 0 },
                    erros = new[] { new { linha = 1, motivo = "Cabeçalho não encontrado" } }
                };
            }

            var cabecalhoEsperado = new[] { "placa", "modelo", "ano", "cliente_identificador", "cliente_nome", "cliente_telefone", "cliente_endereco", "mensalista", "valor_mensalidade" };
            var cabecalhoArquivo = ParsearLinhaCsv(header);
            
            if (cabecalhoArquivo.Length != 9 || !cabecalhoEsperado.SequenceEqual(cabecalhoArquivo.Select(c => c.ToLower())))
            {
                return new { 
                    erro = "Cabeçalho CSV inválido",
                    esperado = string.Join(",", cabecalhoEsperado),
                    encontrado = string.Join(",", cabecalhoArquivo.Select(c => c.ToLower())),
                    processados = 0,
                    inseridos = new { clientes = 0, veiculos = 0 },
                    erros = new[] { new { linha = 1, motivo = "Formato de cabeçalho incorreto" } }
                };
            }

            // Processar linhas de dados
            while (!reader.EndOfStream)
            {
                linhaAtual++;
                var linhaCsv = await reader.ReadLineAsync();
                
                if (string.IsNullOrWhiteSpace(linhaCsv)) 
                {
                    avisos.Add(new { linha = linhaAtual, motivo = "Linha vazia ignorada" });
                    continue;
                }

                processados++;
                
                try
                {
                    var resultado = await ProcessarLinhaCsv(linhaCsv, linhaAtual);
                    
                    switch (resultado.Status)
                    {
                        case "sucesso":
                            sucessos.Add(new { 
                                linha = linhaAtual, 
                                placa = resultado.Placa,
                                cliente = resultado.ClienteNome,
                                acao = resultado.Acao
                            });
                            
                            if (resultado.ClienteInserido) clientesInseridos++;
                            if (resultado.VeiculoInserido) veiculosInseridos++;
                            break;
                            
                        case "erro":
                            erros.Add(new { 
                                linha = linhaAtual, 
                                motivo = resultado.Erro,
                                dados = resultado.DadosLinha
                            });
                            break;
                            
                        case "aviso":
                            avisos.Add(new { 
                                linha = linhaAtual, 
                                motivo = resultado.Erro 
                            });
                            break;
                    }
                }
                catch (Exception ex)
                {
                    erros.Add(new { 
                        linha = linhaAtual, 
                        motivo = $"Erro inesperado: {ex.Message}",
                        dados = linhaCsv
                    });
                }
            }

            // Relatório final detalhado
            return new
            {
                resumo = new {
                    linhas_processadas = processados,
                    sucessos = sucessos.Count,
                    erros = erros.Count,
                    avisos = avisos.Count
                },
                inseridos = new {
                    clientes = clientesInseridos,
                    veiculos = veiculosInseridos
                },
                detalhes = new {
                    sucessos,
                    erros,
                    avisos
                },
                timestamp = DateTime.UtcNow
            };
        }

        private string[] ParsearLinhaCsv(string linha)
        {
            var campos = new List<string>();
            var campoAtual = new StringBuilder();
            bool dentroDeAspas = false;
            
            for (int i = 0; i < linha.Length; i++)
            {
                char c = linha[i];
                
                if (c == '"')
                {
                    dentroDeAspas = !dentroDeAspas;
                }
                else if (c == ',' && !dentroDeAspas)
                {
                    campos.Add(campoAtual.ToString().Trim());
                    campoAtual.Clear();
                }
                else
                {
                    campoAtual.Append(c);
                }
            }
            
            // Adicionar último campo
            campos.Add(campoAtual.ToString().Trim());
            
            return campos.ToArray();
        }

        private async Task<ProcessamentoResultado> ProcessarLinhaCsv(string linhaCsv, int numeroLinha)
        {
            var colunas = ParsearLinhaCsv(linhaCsv);
            
            if (colunas.Length != 9)
            {
                return new ProcessamentoResultado
                {
                    Status = "erro",
                    Erro = $"Número incorreto de colunas. Esperado: 9, Encontrado: {colunas.Length}",
                    DadosLinha = linhaCsv
                };
            }

            try
            {
                // Extrair e validar dados
                var placaOriginal = colunas[0]?.Trim() ?? "";
                var modelo = colunas[1]?.Trim();
                var anoStr = colunas[2]?.Trim();
                var clienteIdentificador = colunas[3]?.Trim();
                var clienteNome = colunas[4]?.Trim();
                var clienteTelefone = colunas[5]?.Trim();
                var clienteEndereco = colunas[6]?.Trim();
                var mensalistaStr = colunas[7]?.Trim();
                var valorMensalidadeStr = colunas[8]?.Trim();

                var (placaValida, mensagemPlaca) = _placa.ValidarComDetalhes(placaOriginal);
                if (!placaValida)
                {
                    return new ProcessamentoResultado
                    {
                        Status = "erro",
                        Erro = $"Placa inválida: {mensagemPlaca}",
                        DadosLinha = linhaCsv,
                        Placa = placaOriginal
                    };
                }

                var placa = _placa.Sanitizar(placaOriginal);

                // Validar se placa já existe
                if (await _db.Veiculos.AnyAsync(v => v.Placa == placa))
                {
                    return new ProcessamentoResultado
                    {
                        Status = "erro",
                        Erro = $"Placa {_placa.Formatar(placa)} já existe no sistema",
                        DadosLinha = linhaCsv,
                        Placa = placa
                    };
                }

                // Validar nome do cliente
                if (string.IsNullOrWhiteSpace(clienteNome))
                {
                    return new ProcessamentoResultado
                    {
                        Status = "erro",
                        Erro = "Nome do cliente é obrigatório",
                        DadosLinha = linhaCsv
                    };
                }

                // Validar ano
                int? ano = null;
                if (!string.IsNullOrWhiteSpace(anoStr))
                {
                    if (!int.TryParse(anoStr, out var anoParseado))
                    {
                        return new ProcessamentoResultado
                        {
                            Status = "erro",
                            Erro = $"Ano inválido: '{anoStr}'. Deve ser um número",
                            DadosLinha = linhaCsv
                        };
                    }
                    
                    if (anoParseado < 1900 || anoParseado > DateTime.Now.Year + 1)
                    {
                        return new ProcessamentoResultado
                        {
                            Status = "erro",
                            Erro = $"Ano fora do intervalo válido: {anoParseado}. Deve estar entre 1900 e {DateTime.Now.Year + 1}",
                            DadosLinha = linhaCsv
                        };
                    }
                    
                    ano = anoParseado;
                }

                // Processar telefone
                var telefone = string.IsNullOrWhiteSpace(clienteTelefone) ? 
                    null : 
                    new string(clienteTelefone.Where(char.IsDigit).ToArray());

                // Validar mensalista
                bool mensalista = false;
                if (!string.IsNullOrWhiteSpace(mensalistaStr))
                {
                    if (!bool.TryParse(mensalistaStr, out mensalista))
                    {
                        return new ProcessamentoResultado
                        {
                            Status = "erro",
                            Erro = $"Valor de mensalista inválido: '{mensalistaStr}'. Use true/false",
                            DadosLinha = linhaCsv
                        };
                    }
                }

                // Validar valor mensalidade
                decimal? valorMensalidade = null;
                if (!string.IsNullOrWhiteSpace(valorMensalidadeStr))
                {
                    if (!decimal.TryParse(valorMensalidadeStr, out var valorParseado))
                    {
                        return new ProcessamentoResultado
                        {
                            Status = "erro",
                            Erro = $"Valor de mensalidade inválido: '{valorMensalidadeStr}'",
                            DadosLinha = linhaCsv
                        };
                    }
                    valorMensalidade = valorParseado;
                }

                // Validação de regra de negócio: mensalista deve ter valor
                if (mensalista && (valorMensalidade == null || valorMensalidade <= 0))
                {
                    return new ProcessamentoResultado
                    {
                        Status = "erro",
                        Erro = "Cliente mensalista deve ter valor de mensalidade maior que zero",
                        DadosLinha = linhaCsv
                    };
                }

                // Validação de regra de negócio: cliente avulso não deve ter valor
                if (!mensalista && valorMensalidade != null)
                {
                    return new ProcessamentoResultado
                    {
                        Status = "erro",
                        Erro = "Cliente não mensalista não pode ter valor de mensalidade",
                        DadosLinha = linhaCsv
                    };
                }

                // Buscar ou criar cliente
                var cliente = await _db.Clientes.FirstOrDefaultAsync(c => 
                    c.Nome.ToLower() == clienteNome.ToLower() && 
                    (telefone == null || c.Telefone == null || c.Telefone == telefone));

                bool clienteInserido = false;
                string acaoRealizada;

                if (cliente == null)
                {
                    cliente = new Cliente 
                    { 
                        Nome = clienteNome.Trim(), 
                        Telefone = telefone, 
                        Endereco = string.IsNullOrWhiteSpace(clienteEndereco) ? null : clienteEndereco.Trim(), 
                        Mensalista = mensalista, 
                        ValorMensalidade = valorMensalidade 
                    };
                    _db.Clientes.Add(cliente);
                    await _db.SaveChangesAsync();
                    clienteInserido = true;
                    acaoRealizada = "Cliente e veículo criados";
                }
                else
                {
                    acaoRealizada = "Veículo adicionado ao cliente existente";
                }

                // Criar veículo
                var veiculo = new Veiculo 
                { 
                    Placa = placa, 
                    Modelo = string.IsNullOrWhiteSpace(modelo) ? null : modelo.Trim(), 
                    Ano = ano, 
                    ClienteId = cliente.Id 
                };
                
                _db.Veiculos.Add(veiculo);
                await _db.SaveChangesAsync();

                return new ProcessamentoResultado
                {
                    Status = "sucesso",
                    Placa = _placa.Formatar(placa),
                    ClienteNome = clienteNome,
                    ClienteInserido = clienteInserido,
                    VeiculoInserido = true,
                    Acao = acaoRealizada
                };
            }
            catch (DbUpdateException ex)
            {
                return new ProcessamentoResultado
                {
                    Status = "erro",
                    Erro = $"Erro no banco de dados: {ex.InnerException?.Message ?? ex.Message}",
                    DadosLinha = linhaCsv
                };
            }
        }

        private class ProcessamentoResultado
        {
            public string Status { get; set; } = "";
            public string? Erro { get; set; }
            public string? DadosLinha { get; set; }
            public string? Placa { get; set; }
            public string? ClienteNome { get; set; }
            public bool ClienteInserido { get; set; }
            public bool VeiculoInserido { get; set; }
            public string? Acao { get; set; }
        }
    }
}