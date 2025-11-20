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
      qc.invalidateQueries({ queryKey:['clientes'] }) // Atualiza contadores de veículos
      setForm({ placa:'', modelo:'', ano:'', clienteId: form.clienteId })
    }
  })

  const update = useMutation({
    mutationFn: ({id, data}) => apiPut(`/api/veiculos/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey:['veiculos'] })
      qc.invalidateQueries({ queryKey:['clientes'] }) // Atualiza contadores de veículos
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
      qc.invalidateQueries({ queryKey:['clientes'] }) // Atualiza contadores de veículos
    }
  })

  useEffect(()=>{
    if(clientes.data?.itens?.length && !clienteId){
      setClienteId(clientes.data.itens[0].id)
      setForm(f => ({...f, clienteId: clientes.data.itens[0].id}))
    }
  }, [clientes.data])

  // Função para abrir modal de edição
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

  // Função para fechar modal
  const closeModal = () => {
    setEditModal(false)
    setEditError('')
    setEditForm({ id: '', placa: '', modelo: '', ano: '', clienteId: '' })
  }

  // Função para salvar edição
  const handleSaveEdit = () => {
    const data = {
      placa: editForm.placa,
      modelo: editForm.modelo || null,
      ano: editForm.ano ? Number(editForm.ano) : null,
      clienteId: editForm.clienteId
    }
    
    update.mutate({ id: editForm.id, data })
  }

  return (
    <div>
      <h2>Veículos</h2>

      <div className="section">
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <label>Cliente: </label>
          <select value={clienteId} onChange={e=>{ setClienteId(e.target.value); setForm(f=>({...f, clienteId:e.target.value}))}}>
            {clientes.data?.itens?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </div>

      <h3>Novo veículo</h3>
      <div className="section">
        <div className="grid grid-4">
          <input placeholder="Placa" value={form.placa} onChange={e=>setForm({...form, placa:e.target.value})}/>
          <input placeholder="Modelo" value={form.modelo} onChange={e=>setForm({...form, modelo:e.target.value})}/>
          <input placeholder="Ano" value={form.ano} onChange={e=>setForm({...form, ano:e.target.value})}/>
          <button onClick={()=>create.mutate({
            placa: form.placa, modelo: form.modelo, ano: form.ano? Number(form.ano): null, clienteId: form.clienteId || clienteId
          })}>Salvar</button>
        </div>
      </div>

      <h3 style={{marginTop:16}}>Lista</h3>
      <div className="section">
        {veiculos.isLoading? <p>Carregando...</p> : (
          <table>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Ano</th>
                <th>Cliente</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {veiculos.data?.map(v=>(
                <tr key={v.id}>
                  <td>{v.placa}</td>
                  <td>{v.modelo || '-'}</td>
                  <td>{v.ano ?? '-'}</td>
                  <td>{v.clienteNome}</td>
                  <td>
                    <button 
                      className="btn-ghost" 
                      onClick={() => handleEdit(v)}
                      style={{marginRight: '8px'}}
                    >
                      Editar
                    </button>
                    <button className="btn-ghost" onClick={()=>remover.mutate(v.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Edição */}
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
            <h3 style={{marginTop: 0}}>Editar Veículo</h3>
            
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
                Placa *
              </label>
              <input 
                placeholder="Placa do veículo" 
                value={editForm.placa} 
                onChange={e=>setEditForm({...editForm, placa:e.target.value})}
                style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
              />
              <small style={{color: '#666', fontSize: '12px'}}>
                Formatos aceitos: ABC1234 (antigo) ou ABC1D23 (Mercosul)
              </small>
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold'}}>
                Modelo
              </label>
              <input 
                placeholder="Modelo do veículo" 
                value={editForm.modelo} 
                onChange={e=>setEditForm({...editForm, modelo:e.target.value})}
                style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
              />
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold'}}>
                Ano
              </label>
              <input 
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                placeholder="Ano do veículo" 
                value={editForm.ano} 
                onChange={e=>setEditForm({...editForm, ano:e.target.value})}
                style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
              />
            </div>

            <div style={{marginBottom: '16px'}}>
              <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold'}}>
                Cliente *
              </label>
              <select
                value={editForm.clienteId}
                onChange={e=>setEditForm({...editForm, clienteId:e.target.value})}
                style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
              >
                <option value="">Selecione um cliente</option>
                {clientes.data?.itens?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.mensalista ? '(Mensalista)' : '(Avulso)'}
                  </option>
                ))}
              </select>
              <small style={{color: '#666', fontSize: '12px'}}>
                Trocar cliente transferirá o veículo para o novo proprietário
              </small>
            </div>

            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px'}}>
              <button 
                onClick={handleSaveEdit}
                disabled={update.isPending || !editForm.placa || !editForm.clienteId}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#196fcaff',
                  color: 'black',
                  cursor: update.isPending || !editForm.placa || !editForm.clienteId ? 'not-allowed' : 'pointer',
                  opacity: update.isPending || !editForm.placa || !editForm.clienteId ? 0.7 : 1
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