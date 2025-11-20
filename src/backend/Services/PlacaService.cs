using System.Text.RegularExpressions;

namespace Parking.Api.Services
{
    public class PlacaService
    {
        /// <summary>
        /// Remove caracteres especiais e converte para maiúsculo
        /// </summary>
        public string Sanitizar(string? placa)
        {
            if (string.IsNullOrWhiteSpace(placa)) 
                return string.Empty;
                
            var p = Regex.Replace(placa, "[^A-Za-z0-9]", "").ToUpperInvariant();
            return p;
        }

        /// <summary>
        /// Valida se a placa está em formato válido do Brasil (antigo) ou Mercosul
        /// Formatos aceitos:
        /// - Brasil antigo: ABC1234 (3 letras + 4 números)
        /// - Mercosul: ABC1D23 (3 letras + 1 número + 1 letra + 2 números)
        /// </summary>
        public bool EhValida(string placa)
        {
            if (string.IsNullOrWhiteSpace(placa)) 
                return false;
                
            // Sanitizar antes de validar para garantir consistência
            var placaLimpa = Sanitizar(placa);
            
            // Deve ter exatamente 7 caracteres
            if (placaLimpa.Length != 7) 
                return false;
            
            return EhFormatoBrasilAntigo(placaLimpa) || EhFormatoMercosul(placaLimpa);
        }

        /// <summary>
        /// Valida formato brasileiro antigo: ABC1234
        /// 3 letras seguidas de 4 números
        /// </summary>
        private static bool EhFormatoBrasilAntigo(string placa)
        {
            return Regex.IsMatch(placa, @"^[A-Z]{3}[0-9]{4}$");
        }

        /// <summary>
        /// Valida formato Mercosul: ABC1D23
        /// 3 letras + 1 número + 1 letra + 2 números
        /// </summary>
        private static bool EhFormatoMercosul(string placa)
        {
            return Regex.IsMatch(placa, @"^[A-Z]{3}[0-9][A-Z][0-9]{2}$");
        }

        /// <summary>
        /// Retorna o tipo de formato da placa
        /// </summary>
        public string ObterTipoPlaca(string placa)
        {
            if (!EhValida(placa)) 
                return "Inválida";
                
            var placaLimpa = Sanitizar(placa);
            
            if (EhFormatoBrasilAntigo(placaLimpa)) 
                return "Brasil Antigo";
                
            if (EhFormatoMercosul(placaLimpa)) 
                return "Mercosul";
                
            return "Inválida";
        }

        /// <summary>
        /// Formata a placa adicionando o hífen na posição correta
        /// ABC1234 -> ABC-1234
        /// ABC1D23 -> ABC1D23 (Mercosul não usa hífen)
        /// </summary>
        public string Formatar(string placa)
        {
            if (!EhValida(placa)) 
                return placa;
                
            var placaLimpa = Sanitizar(placa);
            
            if (EhFormatoBrasilAntigo(placaLimpa))
            {
                // Formato: ABC-1234
                return $"{placaLimpa[..3]}-{placaLimpa[3..]}";
            }
            
            if (EhFormatoMercosul(placaLimpa))
            {
                // Formato Mercosul não usa hífen: ABC1D23
                return placaLimpa;
            }
            
            return placaLimpa;
        }

        /// <summary>
        /// Converte placa do formato antigo para o padrão de armazenamento sem hífen
        /// Tanto ABC-1234 quanto ABC1D23 ficam sem caracteres especiais
        /// </summary>
        public string NormalizarParaArmazenamento(string placa)
        {
            return Sanitizar(placa);
        }

        /// <summary>
        /// Valida e retorna mensagem de erro específica se inválida
        /// </summary>
        public (bool EhValida, string MensagemErro) ValidarComDetalhes(string placa)
        {
            if (string.IsNullOrWhiteSpace(placa))
                return (false, "Placa não pode ser vazia");
                
            var placaLimpa = Sanitizar(placa);
            
            if (placaLimpa.Length != 7)
                return (false, "Placa deve ter 7 caracteres (3 letras + 4 números ou formato Mercosul)");
                
            if (!Regex.IsMatch(placaLimpa, @"^[A-Z]{3}"))
                return (false, "Placa deve começar com 3 letras");
                
            if (EhFormatoBrasilAntigo(placaLimpa))
                return (true, "Placa válida - Formato Brasil antigo");
                
            if (EhFormatoMercosul(placaLimpa))
                return (true, "Placa válida - Formato Mercosul");
                
            return (false, "Formato inválido. Use: ABC1234 (antigo) ou ABC1D23 (Mercosul)");
        }
    }
}