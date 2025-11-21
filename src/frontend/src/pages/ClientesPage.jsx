import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPut, apiDelete } from '../api'

export default function ClientesPage(){
  const qc = useQueryClient()
  const [filtro, setFiltro] = useState('')
  const [mensalista, setMensalista] = useState('all')
  const [form, setForm] = useState({ nome:'', telefone:'', endereco:'', mensalista:false, valorMensalidade:'' })
  const [editModal, setEditModal] = useState(false)
  const [editError, setEditError] = useState('')
  const [editForm, setEditForm] = useState({ 
    id: '', 
    nome: '', 
    telefone: '', 
    endereco: '', 
    mensalista: false, 
    valorMensalidade: '' 
  })

  const q = useQuery({
    queryKey:['clientes', filtro, mensalista],
    queryFn:() => apiGet(`/api/clientes?pagina=1&tamanho=20&filtro=${encodeURIComponent(filtro)}&mensalista=${mensalista}`)
  })

  const create = useMutation({
    mutationFn: (data) => apiPost('/api/clientes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['clientes'] })
      setForm({ nome:'', telefone:'', endereco:'', mensalista:false, valorMensalidade:'' })
    }
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => apiPut(`/api/clientes/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['clientes'] })
      setEditModal(false)
      setEditError('')
    },
    onError: (error) => {
      try {
        const errorData = JSON.parse(error.message)
        setEditError(errorData.message || 'Erro ao atualizar cliente')
      } catch {
        setEditError('Erro ao atualizar cliente')
      }
    }
  })

  const remover = useMutation({
    mutationFn: (id) => apiDelete(`/api/clientes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey:['clientes'] })
  })

  const handleEdit = (cliente) => {
    setEditForm({
      id: cliente.id,
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || '',
      mensalista: cliente.mensalista,
      valorMensalidade: cliente.valorMensalidade ? cliente.valorMensalidade.toString() : ''
    })
    setEditError('')
    setEditModal(true)
  }

  const closeModal = () => {
    setEditModal(false)
    setEditError('')
    setEditForm({ id: '', nome: '', telefone: '', endereco: '', mensalista: false, valorMensalidade: '' })
  }

  const handleSaveEdit = () => {
    const data = {
      nome: editForm.nome,
      telefone: editForm.telefone || null,
      endereco: editForm.endereco || null,
      mensalista: editForm.mensalista,
      valorMensalidade: editForm.valorMensalidade ? Number(editForm.valorMensalidade) : null
    }
    
    update.mutate({ id: editForm.id, data })
  }

  // Estatísticas dos clientes
  const totalClientes = q.data?.itens?.length || 0
  const clientesMensalistas = q.data?.itens?.filter(c => c.mensalista)?.length || 0
  const clientesAvulsos = totalClientes - clientesMensalistas
  const valorTotalMensalidades = q.data?.itens?.reduce((sum, c) => 
    sum + (c.mensalista && c.valorMensalidade ? Number(c.valorMensalidade) : 0), 0) || 0

  return (
    <div style={{
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h2 style={{color: '#f1f5f9', marginBottom: '24px'}}>👥 Clientes</h2>
      
{/* Formulário de Novo Cliente */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <h3 style={{color: '#f1f5f9', marginBottom: '20px', fontSize: '18px'}}>➕ Novo Cliente</h3>
        
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              color: '#94a3b8',
              fontWeight: '500'
            }}>
              Nome *
            </label>
            <input 
              placeholder="Nome completo do cliente" 
              value={form.nome} 
              onChange={e => setForm({...form, nome: e.target.value})}
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
              Telefone
            </label>
            <input 
              placeholder="(31) 99999-9999" 
              value={form.telefone} 
              onChange={e => setForm({...form, telefone: e.target.value})}
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
              Endereço
            </label>
            <input 
              placeholder="Endereço completo (opcional)" 
              value={form.endereco} 
              onChange={e => setForm({...form, endereco: e.target.value})}
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

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'end'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#f1f5f9',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '10px 0'
            }}>
              <input 
                type="checkbox" 
                checked={form.mensalista} 
                onChange={e => setForm({...form, mensalista: e.target.checked})}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#3b82f6'
                }}
              />
              🎯 Cliente Mensalista
            </label>
          </div>
        </div>

        {/* Campo de Valor da Mensalidade - Aparece quando mensalista é marcado */}
        {form.mensalista && (
          <div style={{
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#0f1f0f',
            border: '1px solid #22c55e',
            borderRadius: '8px'
          }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              color: '#86efac',
              fontWeight: '500'
            }}>
              Valor da Mensalidade *
            </label>
            <input 
              type="number"
              step="0.01"
              min="0"
              placeholder="189.90" 
              value={form.valorMensalidade} 
              onChange={e => setForm({...form, valorMensalidade: e.target.value})}
              style={{
                width: '200px',
                padding: '10px 12px',
                border: '1px solid #22c55e',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#0f172a',
                color: '#f1f5f9'
              }}
            />
            <small style={{
              display: 'block',
              marginTop: '4px',
              color: '#4ade80',
              fontSize: '12px'
            }}>
              💡 Valor que será cobrado mensalmente
            </small>
          </div>
        )}

        <div style={{display: 'flex', justifyContent: 'center'}}>
          <button 
            onClick={() => create.mutate({
              nome: form.nome, 
              telefone: form.telefone || null, 
              endereco: form.endereco || null,
              mensalista: form.mensalista, 
              valorMensalidade: form.valorMensalidade ? Number(form.valorMensalidade) : null
            })}
            disabled={create.isPending || !form.nome || (form.mensalista && !form.valorMensalidade)}
            style={{
              padding: '12px 24px',
              backgroundColor: create.isPending || !form.nome || (form.mensalista && !form.valorMensalidade) ? '#6b7280' : '#22c55e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: create.isPending || !form.nome || (form.mensalista && !form.valorMensalidade) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!create.isPending && form.nome && (!form.mensalista || form.valorMensalidade)) {
                e.target.style.backgroundColor = '#16a34a'
              }
            }}
            onMouseLeave={(e) => {
              if (!create.isPending) {
                e.target.style.backgroundColor = (!form.nome || (form.mensalista && !form.valorMensalidade)) ? '#6b7280' : '#22c55e'
              }
            }}
          >
            {create.isPending ? (
              <>⏳ Salvando...</>
            ) : (
              <>💾 Salvar Cliente</>
            )}
          </button>
        </div>

        {(!form.nome || (form.mensalista && !form.valorMensalidade)) && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#1f1a0f',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            fontSize: '12px',
            width: '15%',
            display: 'flex',
            justifyContent: 'center',
            justifySelf: 'center',
          }}>
            <span style={{color: '#fbbf24'}}>
              ⚠️ {!form.nome ? 'Nome é obrigatório' : 'Valor da mensalidade é obrigatório para clientes mensalistas'}
            </span>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #374151',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px'
      }}>
        <h3 style={{color: '#f1f5f9', marginBottom: '16px', fontSize: '18px'}}>🔍 Filtros de Busca</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
              Buscar por nome
            </label>
            <input 
              placeholder="Digite o nome do cliente..." 
              value={filtro} 
              onChange={e => setFiltro(e.target.value)}
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
              Tipo de cliente
            </label>
            <select 
              value={mensalista} 
              onChange={e => setMensalista(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #475569',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#0f172a',
                color: '#f1f5f9'
              }}
            >
              <option value="all">Todos os clientes</option>
              <option value="true">Apenas Mensalistas</option>
              <option value="false">Apenas Avulsos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {totalClientes > 0 && (
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
              {totalClientes}
            </div>
            <div style={{color: '#93c5fd', fontSize: '12px'}}>Total de Clientes</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#0f1f0f',
            border: '1px solid #22c55e',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#4ade80'}}>
              {clientesMensalistas}
            </div>
            <div style={{color: '#86efac', fontSize: '12px'}}>Mensalistas</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#1a1a2e',
            border: '1px solid #8b5cf6',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '24px', fontWeight: 'bold', color: '#a78bfa'}}>
              {clientesAvulsos}
            </div>
            <div style={{color: '#c4b5fd', fontSize: '12px'}}>Avulsos</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#1f1a0f',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{fontSize: '20px', fontWeight: 'bold', color: '#fbbf24'}}>
              R$ {valorTotalMensalidades.toFixed(2)}
            </div>
            <div style={{color: '#fcd34d', fontSize: '12px'}}>Receita Mensal</div>
          </div>
        </div>
      )}

      {/* Lista de Clientes */}
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
            📋 Lista de Clientes
            {filtro && (
              <span style={{
                fontSize: '12px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '500'
              }}>
                Filtro: "{filtro}"
              </span>
            )}
            {mensalista !== 'all' && (
              <span style={{
                fontSize: '12px',
                backgroundColor: mensalista === 'true' ? '#22c55e' : '#8b5cf6',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: '500'
              }}>
                {mensalista === 'true' ? 'Mensalistas' : 'Avulsos'}
              </span>
            )}
          </h3>
        </div>

        <div style={{padding: '20px'}}>
          {q.isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#94a3b8'
            }}>
              <div style={{fontSize: '32px', marginBottom: '12px'}}>⏳</div>
              <p>Carregando clientes...</p>
            </div>
          ) : !q.data?.itens || q.data.itens.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#94a3b8'
            }}>
              <div style={{fontSize: '48px', marginBottom: '16px'}}>👥</div>
              <h4 style={{margin: '0 0 8px 0', color: '#d1d5db'}}>
                {filtro || mensalista !== 'all' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </h4>
              <p style={{margin: 0}}>
                {filtro || mensalista !== 'all' ? 
                  'Tente ajustar os filtros de busca.' : 
                  'Cadastre o primeiro cliente usando o formulário acima.'
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
                    }}>Nome</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Telefone</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Tipo</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      borderBottom: '1px solid #4b5563',
                      color: '#f9fafb',
                      fontWeight: '600'
                    }}>Mensalidade</th>
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
                  {q.data.itens.map((c, idx) => (
                    <tr 
                      key={c.id}
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
                        color: '#f1f5f9',
                        fontWeight: '500'
                      }}>
                        {c.nome}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #374151',
                        color: '#93c5fd',
                        fontFamily: 'monospace',
                        fontSize: '13px'
                      }}>
                        {c.telefone || (
                          <span style={{color: '#6b7280', fontSize: '12px', fontStyle: 'italic'}}>
                            Não informado
                          </span>
                        )}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #374151',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          backgroundColor: c.mensalista ? '#0f1f0f' : '#1a1a2e',
                          color: c.mensalista ? '#86efac' : '#c4b5fd',
                          border: `1px solid ${c.mensalista ? '#22c55e' : '#8b5cf6'}`,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {c.mensalista ? '🎯 Mensalista' : '⚡ Avulso'}
                        </span>
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #374151',
                        textAlign: 'right',
                        color: c.mensalista && c.valorMensalidade ? '#4ade80' : '#6b7280',
                        fontWeight: '500'
                      }}>
                        {c.mensalista && c.valorMensalidade ? (
                          `R$ ${Number(c.valorMensalidade).toFixed(2)}`
                        ) : (
                          <span style={{fontSize: '12px', fontStyle: 'italic'}}>-</span>
                        )}
                      </td>
                      
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #374151',
                        textAlign: 'center'
                      }}>
                        <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                          <button 
                            onClick={() => handleEdit(c)}
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
                            onClick={() => remover.mutate(c.id)}
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
              ✏️ Editar Cliente
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
                Nome *
              </label>
              <input 
                placeholder="Nome completo do cliente" 
                value={editForm.nome} 
                onChange={e => setEditForm({...editForm, nome: e.target.value})}
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
                Telefone
              </label>
              <input 
                placeholder="(31) 99999-9999" 
                value={editForm.telefone} 
                onChange={e => setEditForm({...editForm, telefone: e.target.value})}
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
                Endereço
              </label>
              <input 
                placeholder="Endereço completo (opcional)" 
                value={editForm.endereco} 
                onChange={e => setEditForm({...editForm, endereco: e.target.value})}
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#f1f5f9',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                <input 
                  type="checkbox" 
                  checked={editForm.mensalista} 
                  onChange={e => setEditForm({...editForm, mensalista: e.target.checked, valorMensalidade: e.target.checked ? editForm.valorMensalidade : ''})}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#3b82f6'
                  }}
                />
                🎯 Cliente Mensalista
              </label>
            </div>

            {editForm.mensalista && (
              <div style={{marginBottom: '20px'}}>
                <label style={{
                  display: 'block', 
                  marginBottom: '6px', 
                  fontWeight: '600',
                  color: '#f1f5f9'
                }}>
                  Valor da Mensalidade *
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="189.90" 
                  value={editForm.valorMensalidade} 
                  onChange={e => setEditForm({...editForm, valorMensalidade: e.target.value})}
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
                  Valor que será cobrado mensalmente deste cliente
                </small>
              </div>
            )}

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
                disabled={update.isPending || !editForm.nome || (editForm.mensalista && !editForm.valorMensalidade)}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: update.isPending || !editForm.nome || (editForm.mensalista && !editForm.valorMensalidade) ? '#6b7280' : '#22c55e',
                  color: '#ffffff',
                  cursor: update.isPending || !editForm.nome || (editForm.mensalista && !editForm.valorMensalidade) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!update.isPending && editForm.nome && (!editForm.mensalista || editForm.valorMensalidade)) {
                    e.target.style.backgroundColor = '#16a34a'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!update.isPending) {
                    e.target.style.backgroundColor = (!editForm.nome || (editForm.mensalista && !editForm.valorMensalidade)) ? '#6b7280' : '#22c55e'
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