import React, { useState } from 'react'

export default function FaturaRow({ fatura, index }){
  const [showPlacas, setShowPlacas] = useState(false)
  const [placas, setPlacas] = useState([])
  const [loadingPlacas, setLoadingPlacas] = useState(false)

  async function handleTogglePlacas(){
    if (!showPlacas && placas.length === 0) {
      setLoadingPlacas(true)
      try {
        const response = await apiGet(`/api/faturas/${fatura.id}/placas`)
        setPlacas(response.placa || [])
      } catch (error) {
        console.error('Erro ao carregar placas:', error)
        setPlacas([])
      } finally {
        setLoadingPlacas(false)
      }
    }
    setShowPlacas(!showPlacas)
  }

  return (
    <>
      <tr style={{
        backgroundColor: index % 2 === 0 ? '#1e293b' : '#0f172a',
        transition: 'background-color 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3748'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#1e293b' : '#0f172a'}
      >
        <td style={{
          padding: '12px 16px',
          borderBottom: '1px solid #374151',
          color: '#93c5fd',
          fontFamily: 'monospace',
          fontSize: '13px'
        }}>
          {fatura.clienteId.substring(0, 8)}...
        </td>
        
        <td style={{
          padding: '12px 16px',
          borderBottom: '1px solid #374151',
          color: '#d1d5db'
        }}>
          <span style={{
            backgroundColor: '#374151',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {fatura.competencia}
          </span>
        </td>
        
        <td style={{
          padding: '12px 16px',
          borderBottom: '1px solid #374151',
          color: '#4ade80',
          textAlign: 'right',
          fontWeight: '600'
        }}>
          R$ {Number(fatura.valor || 0).toFixed(2)}
        </td>
        
        <td style={{
          padding: '12px 16px',
          borderBottom: '1px solid #374151',
          color: '#fbbf24',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          🚗 {fatura.qtdVeiculos}
        </td>
        
        <td style={{
          padding: '12px 16px',
          borderBottom: '1px solid #374151',
          textAlign: 'center'
        }}>
          <button
            onClick={handleTogglePlacas}
            disabled={loadingPlacas}
            style={{
              padding: '6px 12px',
              backgroundColor: showPlacas ? '#ef4444' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: loadingPlacas ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!loadingPlacas) {
                e.target.style.backgroundColor = showPlacas ? '#dc2626' : '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingPlacas) {
                e.target.style.backgroundColor = showPlacas ? '#ef4444' : '#3b82f6'
              }
            }}
          >
            {loadingPlacas ? '⏳' : showPlacas ? '👁️ Ocultar' : '🔍 Ver Placas'}
          </button>
        </td>
      </tr>
      
      {/* Linha expandida com placas */}
      {showPlacas && (
        <tr style={{backgroundColor: '#0f172a'}}>
          <td 
            colSpan={5} 
            style={{
              padding: '16px',
              borderBottom: '1px solid #374151',
              backgroundColor: '#1a1a1a'
            }}
          >
            <div style={{marginLeft: '12px'}}>
              <h5 style={{
                margin: '0 0 12px 0',
                color: '#60a5fa',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🚗 Veículos desta Fatura:
              </h5>
              
              {placas.length === 0 ? (
                <p style={{margin: 0, color: '#94a3b8', fontSize: '13px'}}>
                  Nenhum veículo encontrado.
                </p>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '8px'
                }}>
                  {placas.map((veiculo, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#374151',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                    >
                      <div style={{
                        color: '#93c5fd',
                        fontFamily: 'monospace',
                        fontWeight: '600',
                        marginBottom: '2px'
                      }}>
                        {veiculo.PlacaFormatada}
                      </div>
                      <div style={{color: '#94a3b8', fontSize: '11px'}}>
                        {veiculo.Modelo} {veiculo.Ano}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}