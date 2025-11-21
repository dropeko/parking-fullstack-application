import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '../api'

export default function VeiculosPage(){
  const qc = useQueryClient()
  const [clienteId, setClienteId] = useState('')
  const clientes = useQuery({ queryKey:['clientes-mini'], queryFn:() => apiGet('/api/clientes?pagina=1&tamanho=100') })
  const veiculos = useQuery({ queryKey:['veiculos', clienteId], queryFn:() => apiGet(`/api/veiculos${clienteId?`?clienteId=${clienteId}`:''}`) })
  const [form, setForm] = useState({ placa:'', modelo:'', ano:'', clienteId:'' })

  // Estados para o modal de edição
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ 
    id: '', 
    placa: '', 
    modelo: '', 
    ano: '', 
    clienteId: '' 
  })
  const [editError, setEditError] = useState('')

  const create = useMutation({
    mutationFn: (data) => apiPost('/api/veiculos', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['veiculos'] })
      qc.invalidateQueries({ queryKey:['clientes'] })
      setForm({ placa:'', modelo:'', ano:'', clienteId: form.clienteId })
    }
  })

  const update = useMutation({
    mutationFn: ({id, data}) => apiPut(`/api/veiculos/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['veiculos'] })
      qc.invalidateQueries({ queryKey:['clientes'] })
      setEditModal(false)
      setEditError('')
    },
    onError: (error) => {
      try {
        const errorData = JSON.parse(error.message)
        setEditError(errorData.message || 'Erro ao atualizar veículo')
      } catch {
        setEditError('Erro ao atualizar veículo')
      }
    }
  })

  const remover = useMutation({
    mutationFn: (id) => apiDelete(`/api/veiculos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['veiculos'] })
      qc.invalidateQueries({ queryKey:['clientes'] })
    }
  })

  useEffect(()=>{
    if(clientes.data?.itens?.length && !clienteId){
      setClienteId(clientes.data.itens[0].id)
      setForm(f => ({...f, clienteId: clientes.data.itens[0].id}))
    }
  }, [clientes.data])

  const handleEdit = (veiculo) => {
    setEditForm({
      id: veiculo.id,
      placa: veiculo.placa,
      modelo: veiculo.modelo || '',
      ano: veiculo.ano ? veiculo.ano.toString() : '',
      clienteId: veiculo.clienteId
    })
    setEditError('')
    setEditModal(true)
  }

  const closeModal = () => {
    setEditModal(false)
    setEditError('')
    setEditForm({ id: '', placa: '', modelo: '', ano: '', clienteId: '' })
  }

  const handleSaveEdit = () => {
    const data = {
      placa: editForm.placa,
      modelo: editForm.modelo || null,
      ano: editForm.ano ? Number(editForm.ano) : null,
      clienteId: editForm.clienteId
    }
    
    update.mutate({ id: editForm.id, data })
  }

  // Estatísticas dos veículos
  const totalVeiculos = veiculos.data?.length || 0
  const veiculosComModelo = veiculos.data?.filter(v => v.modelo)?.length || 0
  const veiculosComAno = veiculos.data?.filter(v => v.ano)?.length || 0

  return (
    <div style={{
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h2 style={{color: '#f1f5f9', marginBottom: '24px'}}>🚗 Veículos</h2>

      {/* Formulário de Novo Veículo */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <h3 style={{color: '#f1f5f9', marginBottom: '20px', fontSize: '18px'}}>➕ Novo Veículo</h3>
        
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              Placa *
            </label>
            <input 
              placeholder="ABC1234 ou ABC1D23" 
              value={form.placa} 
              onChange={e => setForm({...form, placa: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#0f172a',
                color: '#f1f5f9'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              Modelo
            </label>
            <input 
              placeholder="Ex: Civic, Corolla" 
              value={form.modelo} 
              onChange={e => setForm({...form, modelo: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#0f172a',
                color: '#f1f5f9'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              Ano
            </label>
            <input 
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              placeholder="2023" 
              value={form.ano} 
              onChange={e => setForm({...form, ano: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#0f172a',
                color: '#f1f5f9'
              }}
            />
          </div>

          <div>
            <button 
              onClick={() => create.mutate({
                placa: form.placa, 
                modelo: form.modelo || null, 
                ano: form.ano ? Number(form.ano) : null, 
                clienteId: form.clienteId || clienteId
              })}
              disabled={create.isPending || !form.placa || !clienteId}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: create.isPending ? '#6b7280' : '#22c55e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: create.isPending || !form.placa || !clienteId ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => !create.isPending && form.placa && clienteId && (e.target.style.backgroundColor = '#16a34a')}
              onMouseLeave={(e) => !create.isPending && (e.target.style.backgroundColor = '#22c55e')}
            >
              {create.isPending ? (
                <>⏳ Salvando...</>
              ) : (
                <>💾 Salvar Veículo</>
              )}
            </button>
          </div>
        </div>

        {(!form.placa || !clienteId) && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#1f1a0f',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            fontSize: '12px'
          }}>
            <span style={{color: '#fbbf24'}}>
              ⚠️ Preencha a placa e selecione um cliente para continuar
            </span>
          </div>
        )}
      </div>

      {/* Filtro por Cliente */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <h3 style={{color: '#f1f5f9', marginBottom: '16px', fontSize: '18px'}}>🔍 Filtrar por Cliente</h3>
        
        <div style={{display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap'}}>
          <label style={{
            fontSize: '14px', 
            color: '#94a3b8',
            fontWeight: '500',
            minWidth: 'fit-content'
          }}>
            Cliente:
          </label>
          <select 
            value={clienteId} 
            onChange={e => { 
              setClienteId(e.target.value)
              setForm(f => ({...f, clienteId: e.target.value}))
            }}
            style={{
              padding: '10px 12px',
              border: '1px solid #475569',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: '#0f172a',
              color: '#f1f5f9',
              minWidth: '200px',
              flex: 1
            }}
          >
            <option value="">Todos os clientes</option>
            {clientes.data?.itens?.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome} {c.mensalista ? '(Mensalista)' : '(Avulso)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Estatísticas */}
      {totalVeiculos > 0 && (
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
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
              {totalVeiculos}
            </div>
            <div style={{color: '#93c5fd', fontSize: '12px'}}>Total de Veículos</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#1a1a2e',
            border: '1px solid #8b5cf6',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#a78bfa'}}>
              {veiculosComModelo}
            </div>
            <div style={{color: '#c4b5fd', fontSize: '12px'}}>Com Modelo</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#0f1f0f',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#4ade80'}}>
              {veiculosComAno}
            </div>
            <div style={{color: '#86efac', fontSize: '12px'}}>Com Ano</div>
          </div>
        </div>
      )}

      {/* Lista de Veículos */}
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
            📋 Lista de Veículos {clienteId && `- ${clientes.data?.itens?.find(c => c.id === clienteId)?.nome || 'Cliente Selecionado'}`}
          </h3>
        </div>

        <div style={{padding: '20px'}}>
          {veiculos.isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#94a3b8'
            }}>
              <div style={{fontSize: '32px', marginBottom: '12px'}}>⏳</div>
              <p>Carregando veículos...</p>
            </div>
          ) : !veiculos.data || veiculos.data.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#94a3b8'
            }}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>🚗</div>
              <h4 style={{margin: '0 0 8px 0', color: '#d1d5db'}}>
                {clienteId ? 'Nenhum veículo encontrado para este cliente' : 'Nenhum veículo cadastrado'}
              </h4>
              <p style={{margin: 0}}>
                {clienteId ? 
                  'Cadastre um novo veículo usando o formulário acima.' : 
                  'Selecione um cliente ou cadastre um novo veículo.'
                }
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
                    }}>Placa</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Modelo</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Ano</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Cliente</th>
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
                  {veiculos.data.map((v, idx) => (
                    <tr 
                      key={v.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#1e293b' : '#0f172a',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3748'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#1e293b' : '#0f172a'}
                    >
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #374151',
                        color: '#93c5fd',
                        fontFamily: 'monospace',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {v.placa}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #374151',
                        color: '#d1d5db'
                      }}>
                        {v.modelo || (
                          <span style={{color: '#6b7280', fontSize: '12px', fontStyle: 'italic'}}>
                            Não informado
                          </span>
                        )}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #374151',
                        color: v.ano ? '#fbbf24' : '#6b7280',
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        {v.ano ?? (
                          <span style={{fontSize: '12px', fontStyle: 'italic'}}>-</span>
                        )}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #374151',
                        color: '#86efac'
                      }}>
                        {v.clienteNome}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #374151',
                        textAlign: 'center'
                      }}>
                        <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                          <button 
                            onClick={() => handleEdit(v)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#3b82f6',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                          >
                            ✏️ Editar
                          </button>
                          
                          <button 
                            onClick={() => remover.mutate(v.id)}
                            disabled={remover.isPending}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: remover.isPending ? '#6b7280' : '#ef4444',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: remover.isPending ? 'not-allowed' : 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => !remover.isPending && (e.target.style.backgroundColor = '#dc2626')}
                            onMouseLeave={(e) => !remover.isPending && (e.target.style.backgroundColor = '#ef4444')}
                          >
                            {remover.isPending ? '⏳' : '🗑️ Excluir'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edição */}
      {editModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #374151',
            padding: '24px',
            borderRadius: '12px',
            minWidth: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{
              marginTop: 0,
              marginBottom: '20px',
              color: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ✏️ Editar Veículo
            </h3>
            
            {editError && (
              <div style={{
                backgroundColor: '#1f1f1f',
                color: '#f87171',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>❌</span>
                <span>{editError}</span>
              </div>
            )}

            <div style={{marginBottom: '16px'}}>
              <label style={{
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: '600',
                color: '#f1f5f9'
              }}>
                Placa *
              </label>
              <input 
                placeholder="ABC1234 ou ABC1D23" 
                value={editForm.placa} 
                onChange={e => setEditForm({...editForm, placa: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '14px'
                }}
              />
              <small style={{color: '#94a3b8', fontSize: '12px'}}>
                Formatos aceitos: ABC1234 (antigo) ou ABC1D23 (Mercosul)
              </small>
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: '600',
                color: '#f1f5f9'
              }}>
                Modelo
              </label>
              <input 
                placeholder="Modelo do veículo" 
                value={editForm.modelo} 
                onChange={e => setEditForm({...editForm, modelo: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: '600',
                color: '#f1f5f9'
              }}>
                Ano
              </label>
              <input 
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                placeholder="Ano do veículo" 
                value={editForm.ano} 
                onChange={e => setEditForm({...editForm, ano: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{marginBottom: '20px'}}>
              <label style={{
                display: 'block', 
                marginBottom: '6px', 
                fontWeight: '600',
                color: '#f1f5f9'
              }}>
                Cliente *
              </label>
              <select
                value={editForm.clienteId}
                onChange={e => setEditForm({...editForm, clienteId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '14px'
                }}
              >
                <option value="">Selecione um cliente</option>
                {clientes.data?.itens?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.mensalista ? '(Mensalista)' : '(Avulso)'}
                  </option>
                ))}
              </select>
              <small style={{color: '#94a3b8', fontSize: '12px'}}>
                ⚠️ Trocar cliente transferirá o veículo e será registrado no histórico
              </small>
            </div>

            <div style={{
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px', 
              marginTop: '24px'
            }}>
              <button 
                onClick={closeModal}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  backgroundColor: '#374151',
                  color: '#f1f5f9',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#374151'}
              >
                ❌ Cancelar
              </button>
              
              <button 
                onClick={handleSaveEdit}
                disabled={update.isPending || !editForm.placa || !editForm.clienteId}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: update.isPending || !editForm.placa || !editForm.clienteId ? '#6b7280' : '#22c55e',
                  color: '#ffffff',
                  cursor: update.isPending || !editForm.placa || !editForm.clienteId ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!update.isPending && editForm.placa && editForm.clienteId) {
                    e.target.style.backgroundColor = '#16a34a'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!update.isPending) {
                    e.target.style.backgroundColor = !editForm.placa || !editForm.clienteId ? '#6b7280' : '#22c55e'
                  }
                }}
              >
                {update.isPending ? '⏳ Salvando...' : '💾 Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}