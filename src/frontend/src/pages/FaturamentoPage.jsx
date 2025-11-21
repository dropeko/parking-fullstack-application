import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiPost } from '../api'
import FaturaRow from '../components/FaturaRow.jsx'

export default function FaturamentoPage(){
  const [comp, setComp] = useState('2025-08')
  const [loading, setLoading] = useState(false)
  const [lastGenerated, setLastGenerated] = useState(null)
  
  const faturas = useQuery({ 
    queryKey: ['faturas', comp], 
    queryFn: () => apiGet(`/api/faturas?competencia=${comp}`)
  })

  async function handleGerarFaturas(){
    setLoading(true)
    setLastGenerated(null)
    
    try {
      const result = await apiPost('/api/faturas/gerar', { competencia: comp })
      setLastGenerated(result)
      faturas.refetch()
    } catch (error) {
      console.error('Erro ao gerar faturas:', error)
      setLastGenerated({ erro: 'Erro ao gerar faturas', detalhes: error.message })
    } finally {
      setLoading(false)
    }
  }

  const totalValor = faturas.data?.reduce((sum, f) => sum + Number(f.valor || 0), 0) || 0
  const totalVeiculos = faturas.data?.reduce((sum, f) => sum + (f.qtdVeiculos || 0), 0) || 0

  return (
    <div style={{
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h2 style={{color: '#f1f5f9', marginBottom: '24px'}}>💰 Faturamento</h2>

      {/* Controles de Geração */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <h3 style={{color: '#f1f5f9', marginBottom: '16px', fontSize: '18px'}}>🎯 Gerar Faturas</h3>
        
        <div style={{display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap'}}>
          <div>
            <label style={{
              display: 'block', 
              marginBottom: '4px', 
              fontSize: '14px', 
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              Competência (YYYY-MM):
            </label>
            <input 
              value={comp} 
              onChange={e => setComp(e.target.value)} 
              placeholder="2025-01"
              disabled={loading}
              style={{
                padding: '10px 12px',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#0f172a',
                color: '#f1f5f9',
                minWidth: '120px'
              }}
            />
          </div>
          
          <div style={{alignSelf: 'flex-end'}}>
            <button 
              onClick={handleGerarFaturas}
              disabled={loading || !comp}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#6b7280' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#3b82f6')}
            >
              {loading ? (
                <>⏳ Gerando...</>
              ) : (
                <>⚡ Gerar Faturas</>
              )}
            </button>
          </div>
        </div>

        {/* Resultado da Última Geração */}
        {lastGenerated && (
          <div style={{marginTop: '16px'}}>
            {lastGenerated.erro ? (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#1f1f1f',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>❌</span>
                <div>
                  <strong style={{color: '#f87171'}}>{lastGenerated.erro}</strong>
                  {lastGenerated.detalhes && (
                    <div style={{color: '#fca5a5', fontSize: '12px', marginTop: '2px'}}>
                      {lastGenerated.detalhes}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#0f1f0f',
                border: '1px solid #22c55e',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>✅</span>
                <div style={{color: '#86efac'}}>
                  <strong>{lastGenerated.criadas}</strong> faturas geradas para {lastGenerated.competencia}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info sobre Bug */}
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          backgroundColor: '#1f1a0f',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
            <span>⚠️</span>
            <strong style={{color: '#fbbf24'}}>Nota sobre Faturamento Proporcional:</strong>
          </div>
          <p style={{margin: 0, color: '#fcd34d', lineHeight: '1.4'}}>
            O sistema agora calcula faturas proporcionais baseadas no histórico real de propriedade dos veículos, 
            considerando transferências durante o mês.
          </p>
        </div>
      </div>

      {/* Resumo das Faturas */}
      {faturas.data && faturas.data.length > 0 && (
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '32px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#1e293b',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#60a5fa'}}>
              {faturas.data.length}
            </div>
            <div style={{color: '#93c5fd', fontSize: '12px'}}>Total de Faturas</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#0f1f0f',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#4ade80'}}>
              R$ {totalValor.toFixed(2)}
            </div>
            <div style={{color: '#86efac', fontSize: '12px'}}>Valor Total</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#1a1a2e',
            border: '1px solid #8b5cf6',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#a78bfa'}}>
              {totalVeiculos}
            </div>
            <div style={{color: '#c4b5fd', fontSize: '12px'}}>Total de Veículos</div>
          </div>
        </div>
      )}

      {/* Lista de Faturas */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #374151',
          backgroundColor: '#374151'
        }}>
          <h3 style={{
            margin: 0, 
            fontSize: '18px', 
            color: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 Faturas - {comp}
          </h3>
        </div>

        <div style={{padding: '20px'}}>
          {faturas.isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#94a3b8'
            }}>
              <div style={{fontSize: '32px', marginBottom: '12px'}}>⏳</div>
              <p>Carregando faturas...</p>
            </div>
          ) : !faturas.data || faturas.data.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#94a3b8'
            }}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>📄</div>
              <h4 style={{margin: '0 0 8px 0', color: '#d1d5db'}}>Nenhuma fatura encontrada</h4>
              <p style={{margin: 0}}>
                Gere faturas para a competência {comp} usando o botão acima.
              </p>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#0f172a'
              }}>
                <thead>
                  <tr style={{backgroundColor: '#374151'}}>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Cliente ID</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Competência</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Valor</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Veículos</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.data.map((f, idx) => (
                    <FaturaRow key={f.id} fatura={f} index={idx} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

