import React, { useState, useRef, useEffect } from 'react'

export default function CsvUploadPage(){
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  const resumoRef = useRef(null)

  async function handleUpload(file){
    if (!file) return
    
    setLoading(true)
    setLog(null)
    
    try {
      const fd = new FormData()
      fd.append('file', file)
      
      const r = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/import/csv', {
        method: 'POST',
        body: fd
      })
      
      const j = await r.json()
      setLog(j)
    } catch (error) {
      setLog({
        erro: "Erro de conexão",
        detalhes: "Não foi possível conectar ao servidor"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (log && resumoRef.current) {
      setTimeout(() => {
        resumoRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        })
      }, 100)
    }
  }, [log])

  async function handleSubmit(e){
    e.preventDefault()
    const file = e.target.file.files[0]
    await handleUpload(file)
  }

  function handleDrag(e){
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  function handleDrop(e){
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  return (
    <div style={{maxWidth: '1000px', margin: '0 auto'}}>
      <h2>📤 Importar CSV de Veículos</h2>

      {/* Formato Esperado */}
      <div style={{
        marginTop: '12px', 
        padding: '8px 12px',
        backgroundColor: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: '6px'
      }}>
        <h5 style={{margin: '0 0 4px 0', color: '#0ea5e9', fontSize: '14px'}}>💡 Formato esperado:</h5>
        <code style={{fontSize: '11px', color: '#0369a1', wordBreak: 'break-all'}}>
          placa,modelo,ano,cliente_identificador,cliente_nome,cliente_telefone,cliente_endereco,mensalista,valor_mensalidade
        </code>
      </div>
      
      {/* Área de Upload */}
      <div className="section">
        <div 
          style={{
            border: `2px dashed ${dragActive ? '#007bff' : '#ddd'}`,
            borderRadius: '8px',
            padding: loading ? '16px' : '20px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#f8f9ff' : '#fafafa',
            transition: 'all 0.2s ease',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {loading ? (
            <div>
              <div style={{fontSize: '32px', marginBottom: '8px'}}>⏳</div>
              <h4 style={{margin: '4px 0', color: '#007bff'}}>Processando arquivo...</h4>
              <p style={{color: '#666', margin: 0, fontSize: '14px'}}>Aguarde enquanto importamos os dados</p>
            </div>
          ) : (
            <div>
              <div style={{fontSize: '32px', marginBottom: '8px'}}>
                {dragActive ? '📂' : '📁'}
              </div>
              <h4 style={{margin: '4px 0'}}>
                {dragActive ? 'Solte o arquivo aqui' : 'Arraste seu arquivo CSV aqui'}
              </h4>
              <p style={{color: '#666', marginBottom: '12px', fontSize: '14px'}}>
                ou clique para selecionar um arquivo
              </p>
              
              <form onSubmit={handleSubmit} style={{display: 'inline-block'}}>
                <input 
                  type="file" 
                  name="file" 
                  accept=".csv"
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginRight: '8px',
                    fontSize: '14px'
                  }}
                />
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#007bff',
                    color: 'black',
                    border: '1px solid #ddd',
                    marginTop: '4px',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    fontSize: '14px'
                  }}
                >
                  {loading ? 'Enviando...' : 'Enviar Arquivo'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Relatório de Resultados */}
      {log && (
        <>
          {/* Resumo Executivo - COM REF PARA SCROLL */}
          <div className="section" ref={resumoRef}>
            <h3>📊 Resumo da Importação</h3>
            
            {log.erro ? (
              <div style={{
                padding: '16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <h4 style={{margin: '0 0 8px 0', color: '#dc2626'}}>❌ Erro no processamento</h4>
                <p style={{margin: 0, color: '#dc2626'}}>{log.erro}</p>
                {log.detalhes && <p style={{margin: '4px 0 0 0', color: '#991b1b', fontSize: '14px'}}>{log.detalhes}</p>}
              </div>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px'}}>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: '#0369a1'}}>
                    {log.resumo?.linhas_processadas || 0}
                  </div>
                  <div style={{color: '#0369a1', fontSize: '12px'}}>Linhas Processadas</div>
                </div>

                <div style={{
                  padding: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #22c55e',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: '#16a34a'}}>
                    {log.resumo?.sucessos || 0}
                  </div>
                  <div style={{color: '#16a34a', fontSize: '12px'}}>Sucessos</div>
                </div>

                <div style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: '#dc2626'}}>
                    {log.resumo?.erros || 0}
                  </div>
                  <div style={{color: '#dc2626', fontSize: '12px'}}>Erros</div>
                </div>

                <div style={{
                  padding: '12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #f59e0b',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: '#d97706'}}>
                    {log.resumo?.avisos || 0}
                  </div>
                  <div style={{color: '#d97706', fontSize: '12px'}}>Avisos</div>
                </div>
              </div>
            )}

            {log.inseridos && (
              <div style={{
                padding: '12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #22c55e',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <h4 style={{margin: '0 0 6px 0', color: '#16a34a', fontSize: '16px'}}>✅ Dados inseridos com sucesso</h4>
                <div style={{display: 'flex', gap: '20px', fontSize: '14px'}}>
                  <span style={{color: '#16a34a'}}>
                    👥 <strong>{log.inseridos.clientes}</strong> {log.inseridos.clientes === 1 ? 'cliente' : 'clientes'}
                  </span>
                  <span style={{color: '#16a34a'}}>
                    🚗 <strong>{log.inseridos.veiculos}</strong> {log.inseridos.veiculos === 1 ? 'veículo' : 'veículos'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Detalhes dos Sucessos */}
          {log.detalhes?.sucessos?.length > 0 && (
            <div className="section">
              <h3>✅ Registros Importados ({log.detalhes.sucessos.length})</h3>
              <div style={{maxHeight: '300px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '8px'}}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f9fafb', position: 'sticky', top: 0}}>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #d1d5db'}}>Linha</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #d1d5db'}}>Placa</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #d1d5db'}}>Cliente</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #d1d5db'}}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.detalhes.sucessos.map((sucesso, idx) => (
                      <tr key={idx} style={{backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb'}}>
                        <td style={{padding: '8px 12px', borderBottom: '1px solid #e5e7eb'}}>{sucesso.linha}</td>
                        <td style={{padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontFamily: 'monospace'}}>{sucesso.placa}</td>
                        <td style={{padding: '8px 12px', borderBottom: '1px solid #e5e7eb'}}>{sucesso.cliente}</td>
                        <td style={{padding: '8px 12px', borderBottom: '1px solid #e5e7eb', fontSize: '12px', color: '#16a34a'}}>{sucesso.acao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detalhes dos Erros */}
          {log.detalhes?.erros?.length > 0 && (
            <div className="section">
              <h3>❌ Erros Encontrados ({log.detalhes.erros.length})</h3>
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                {log.detalhes.erros.map((erro, idx) => (
                  <div key={idx} style={{
                    marginBottom: '12px',
                    padding: '12px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: '4px'}}>
                      <span style={{fontSize: '18px', marginRight: '8px'}}>❌</span>
                      <strong style={{color: '#dc2626'}}>Linha {erro.linha}:</strong>
                      <span style={{marginLeft: '8px', color: '#991b1b'}}>{erro.motivo}</span>
                    </div>
                    {erro.dados && (
                      <details style={{marginTop: '8px'}}>
                        <summary style={{cursor: 'pointer', color: '#991b1b', fontSize: '12px'}}>
                          Ver dados da linha
                        </summary>
                        <pre style={{
                          fontSize: '11px',
                          backgroundColor: '#fee',
                          padding: '8px',
                          margin: '4px 0 0 0',
                          borderRadius: '4px',
                          overflow: 'auto'
                        }}>
                          {erro.dados}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avisos */}
          {log.detalhes?.avisos?.length > 0 && (
            <div className="section">
              <h3>⚠️ Avisos ({log.detalhes.avisos.length})</h3>
              <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                {log.detalhes.avisos.map((aviso, idx) => (
                  <div key={idx} style={{
                    marginBottom: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fbbf24',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{fontSize: '16px', marginRight: '8px'}}>⚠️</span>
                    <span style={{color: '#92400e'}}>Linha {aviso.linha}: {aviso.motivo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}