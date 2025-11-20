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
    onSuccess: () => qc.invalidateQueries({ queryKey:['clientes'] })
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
      valorMensalidade: cliente.valorMensalidade ? cliente.valorMensalidade.toString() : null
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

  return (
    <div>
      <h2>Clientes</h2>

      <div className="section">
        <div className="grid grid-3">
          <input placeholder="Buscar por nome" value={filtro} onChange={e=>setFiltro(e.target.value)} />
          <select value={mensalista} onChange={e=>setMensalista(e.target.value)}>
            <option value="all">Todos</option>
            <option value="true">Mensalistas</option>
            <option value="false">Não mensalistas</option>
          </select>
          <div/>
        </div>
      </div>

      <h3>Novo cliente</h3>
      <div className="section">
        <div className="grid grid-4">
          <input placeholder="Nome" value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})}/>
          <input placeholder="Telefone" value={form.telefone} onChange={e=>setForm({...form, telefone:e.target.value})}/>
          <input placeholder="Endereço" value={form.endereco} onChange={e=>setForm({...form, endereco:e.target.value})}/>
          <label style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={form.mensalista} onChange={e=>setForm({...form, mensalista:e.target.checked})}/> Mensalista
          </label>
          <input placeholder="Valor mensalidade" value={form.valorMensalidade} onChange={e=>setForm({...form, valorMensalidade:e.target.value})}/>
          <div/>
          <div/>
          <button onClick={()=>create.mutate({
            nome:form.nome, telefone:form.telefone, endereco:form.endereco,
            mensalista:form.mensalista, valorMensalidade:form.valorMensalidade? Number(form.valorMensalidade): null
          })}>Salvar</button>
        </div>
      </div>

      <h3 style={{marginTop:16}}>Lista</h3>
      <div className="section">
        {q.isLoading? <p>Carregando...</p> : (
          <table>
            <thead><tr><th>Nome</th><th>Telefone</th><th>Mensalista</th><th>Ações</th></tr></thead>
            <tbody>
              {q.data.itens.map(c=>(
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{c.telefone}</td>
                  <td>{c.mensalista? 'Sim':'Não'}</td>
                  <td>
                    <button className="btn-ghost" onClick={()=>handleEdit(c)} style={{marginRight: '8px'}}>
                      Editar
                    </button>
                    <button className="btn-ghost" onClick={()=>remover.mutate(c.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            minWidth: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{marginTop: 0}}>Editar Cliente</h3>
            
            {editError && (
              <div style={{
                backgroundColor: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                border: '1px solid #fcc'
              }}>
                {editError}
              </div>
            )}

            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold'}}>
                Nome *
              </label>
              <input 
                placeholder="Nome do cliente" 
                value={editForm.nome} 
                onChange={e=>setEditForm({...editForm, nome:e.target.value})}
                style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
              />
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold'}}>
                Telefone
              </label>
              <input 
                placeholder="Telefone" 
                value={editForm.telefone} 
                onChange={e=>setEditForm({...editForm, telefone:e.target.value})}
                style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
              />
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold'}}>
                Endereço
              </label>
              <input 
                placeholder="Endereço" 
                value={editForm.endereco} 
                onChange={e=>setEditForm({...editForm, endereco:e.target.value})}
                style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
              />
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'}}>
                <input 
                  type="checkbox" 
                  checked={editForm.mensalista} 
                  onChange={e=>setEditForm({...editForm, mensalista:e.target.checked})}
                />
                Cliente Mensalista
              </label>
            </div>

            {editForm.mensalista && (
              <div style={{marginBottom: '16px'}}>
                <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold'}}>
                  Valor da Mensalidade *
                </label>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="Valor da mensalidade" 
                  value={editForm.valorMensalidade} 
                  onChange={e=>setEditForm({...editForm, valorMensalidade:e.target.value})}
                  style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                />
              </div>
            )}

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px'}}>
              <button 
                onClick={handleSaveEdit}
                disabled={update.isPending}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#007bff',
                  color: 'black',
                  cursor: update.isPending ? 'not-allowed' : 'pointer',
                  opacity: update.isPending ? 0.7 : 1
                }}
              >
                {update.isPending ? 'Salvando...' : 'Salvar'}
              </button>
              <button 
                onClick={closeModal}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}