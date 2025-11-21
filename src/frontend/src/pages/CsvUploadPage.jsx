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
    <div style={{
      maxWidth: '1000px', 
      margin: '0 auto',
      backgroundColor: '#0f172a', // Dark background
      color: '#f1f5f9', // Light text
      minHeight: '100vh',
      padding: '20px'
    }}>
      <h2 style={{color: '#f1f5f9', marginBottom: '24px'}}>📤 Importar CSV de Veículos</h2>

      {/* Formato Esperado - Dark Mode */}
      <div style={{
        marginTop: '12px', 
        padding: '12px 16px',
        backgroundColor: '#1e293b', // Dark card background
        border: '1px solid #3b82f6', // Blue border
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <h5 style={{margin: '0 0 8px 0', color: '#60a5fa', fontSize: '14px', fontWeight: '600'}}>💡 Formato esperado:</h5>
        <code style={{
          fontSize: '11px', 
          color: '#93c5fd', // Light blue for code
          wordBreak: 'break-all',
          backgroundColor: '#0f172a',
          padding: '8px',
          borderRadius: '4px',
          display: 'block',
          border: '1px solid #334155'
        }}>
          placa,modelo,ano,cliente_identificador,cliente_nome,cliente_telefone,cliente_endereco,mensalista,valor_mensalidade
        </code>
      </div>
      
      {/* Área de Upload - Dark Mode */}
      <div className="section" style={{marginBottom: '32px'}}>
        <div 
          style={{
            border: `2px dashed ${dragActive ? '#60a5fa' : '#475569'}`, // Blue when active, gray when not
            borderRadius: '12px',
            padding: loading ? '20px' : '24px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#1e293b' : '#1a1a1a', // Dark backgrounds
            transition: 'all 0.3s ease',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {loading ? (
            <div>
              <div style={{fontSize: '36px', marginBottom: '12px'}}>⏳</div>
              <h4 style={{margin: '8px 0', color: '#60a5fa'}}>Processando arquivo...</h4>
              <p style={{color: '#94a3b8', margin: 0, fontSize: '14px'}}>Aguarde enquanto importamos os dados</p>
            </div>
          ) : (
            <div>
              <div style={{fontSize: '36px', marginBottom: '12px'}}>
                {dragActive ? '📂' : '📁'}
              </div>
              <h4 style={{margin: '8px 0', color: '#f1f5f9'}}>
                {dragActive ? 'Solte o arquivo aqui' : 'Arraste seu arquivo CSV aqui'}
              </h4>
              <p style={{color: '#94a3b8', marginBottom: '16px', fontSize: '14px'}}>
                ou clique para selecionar um arquivo
              </p>
              
              <form onSubmit={handleSubmit} style={{display: 'inline-block'}}>
                <input 
                  type="file" 
                  name="file" 
                  accept=".csv"
                  disabled={loading}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    marginRight: '12px',
                    fontSize: '14px',
                    backgroundColor: '#1e293b',
                    color: '#f1f5f9'
                  }}
                />
                <button 
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#2563eb')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#3b82f6')}
                >
                  {loading ? 'Enviando...' : 'Enviar Arquivo'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Relatório de Resultados - Dark Mode */}
      {log && (
        <>
          {/* Resumo Executivo */}
          <div className="section" ref={resumoRef} style={{marginBottom: '32px'}}>
            <h3 style={{color: '#f1f5f9', marginBottom: '20px'}}>📊 Resumo da Importação</h3>
            
            {log.erro ? (
              <div style={{
                padding: '16px',
                backgroundColor: '#1f1f1f', // Dark error background
                border: '1px solid #ef4444',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <h4 style={{margin: '0 0 8px 0', color: '#f87171'}}>❌ Erro no processamento</h4>
                <p style={{margin: 0, color: '#fca5a5'}}>{log.erro}</p>
                {log.detalhes && <p style={{margin: '4px 0 0 0', color: '#dc2626', fontSize: '14px'}}>{log.detalhes}</p>}
              </div>
            ) : (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px'}}>
                {/* Card Processadas - Blue Dark Theme */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#60a5fa'}}>
                    {log.resumo?.linhas_processadas || 0}
                  </div>
                  <div style={{color: '#93c5fd', fontSize: '12px'}}>Linhas Processadas</div>
                </div>

                {/* Card Sucessos - Green Dark Theme */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#0f1f0f',
                  border: '1px solid #22c55e',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#4ade80'}}>
                    {log.resumo?.sucessos || 0}
                  </div>
                  <div style={{color: '#86efac', fontSize: '12px'}}>Sucessos</div>
                </div>

                {/* Card Erros - Red Dark Theme */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#1f1f1f',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#f87171'}}>
                    {log.resumo?.erros || 0}
                  </div>
                  <div style={{color: '#fca5a5', fontSize: '12px'}}>Erros</div>
                </div>

                {/* Card Avisos - Yellow Dark Theme */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#1f1a0f',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#fbbf24'}}>
                    {log.resumo?.avisos || 0}
                  </div>
                  <div style={{color: '#fcd34d', fontSize: '12px'}}>Avisos</div>
                </div>
              </div>
            )}

            {log.inseridos && (
              <div style={{
                padding: '16px',
                backgroundColor: '#0f1f0f',
                border: '1px solid #22c55e',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{margin: '0 0 8px 0', color: '#4ade80', fontSize: '16px'}}>✅ Dados inseridos com sucesso</h4>
                <div style={{display: 'flex', gap: '24px', fontSize: '14px'}}>
                  <span style={{color: '#86efac'}}>
                    👥 <strong>{log.inseridos.clientes}</strong> {log.inseridos.clientes === 1 ? 'cliente' : 'clientes'}
                  </span>
                  <span style={{color: '#86efac'}}>
                    🚗 <strong>{log.inseridos.veiculos}</strong> {log.inseridos.veiculos === 1 ? 'veículo' : 'veículos'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Detalhes dos Sucessos - Dark Mode */}
          {log.detalhes?.sucessos?.length > 0 && (
            <div className="section" style={{marginBottom: '32px'}}>
              <h3 style={{color: '#f1f5f9', marginBottom: '16px'}}>✅ Registros Importados ({log.detalhes.sucessos.length})</h3>
              <div style={{
                maxHeight: '350px', 
                overflowY: 'auto', 
                border: '1px solid #374151', 
                borderRadius: '8px',
                backgroundColor: '#1e293b'
              }}>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{backgroundColor: '#374151', position: 'sticky', top: 0}}>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #4b5563', color: '#f9fafb'}}>Linha</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #4b5563', color: '#f9fafb'}}>Placa</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #4b5563', color: '#f9fafb'}}>Cliente</th>
                      <th style={{padding: '12px', textAlign: 'left', borderBottom: '1px solid #4b5563', color: '#f9fafb'}}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {log.detalhes.sucessos.map((sucesso, idx) => (
                      <tr key={idx} style={{backgroundColor: idx % 2 === 0 ? '#1e293b' : '#2d3748'}}>
                        <td style={{padding: '10px 12px', borderBottom: '1px solid #374151', color: '#d1d5db'}}>{sucesso.linha}</td>
                        <td style={{padding: '10px 12px', borderBottom: '1px solid #374151', fontFamily: 'monospace', color: '#93c5fd'}}>{sucesso.placa}</td>
                        <td style={{padding: '10px 12px', borderBottom: '1px solid #374151', color: '#d1d5db'}}>{sucesso.cliente}</td>
                        <td style={{padding: '10px 12px', borderBottom: '1px solid #374151', fontSize: '12px', color: '#86efac'}}>{sucesso.acao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detalhes dos Erros - Dark Mode */}
          {log.detalhes?.erros?.length > 0 && (
            <div className="section" style={{marginBottom: '32px'}}>
              <h3 style={{color: '#f1f5f9', marginBottom: '16px'}}>❌ Erros Encontrados ({log.detalhes.erros.length})</h3>
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                {log.detalhes.erros.map((erro, idx) => (
                  <div key={idx} style={{
                    marginBottom: '12px',
                    padding: '16px',
                    backgroundColor: '#1f1f1f',
                    border: '1px solid #ef4444',
                    borderRadius: '8px'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                      <span style={{fontSize: '18px', marginRight: '8px'}}>❌</span>
                      <strong style={{color: '#f87171'}}>Linha {erro.linha}:</strong>
                      <span style={{marginLeft: '8px', color: '#fca5a5'}}>{erro.motivo}</span>
                    </div>
                    {erro.dados && (
                      <details style={{marginTop: '8px'}}>
                        <summary style={{cursor: 'pointer', color: '#ef4444', fontSize: '12px', fontWeight: '500'}}>
                          Ver dados da linha
                        </summary>
                        <pre style={{
                          fontSize: '11px',
                          backgroundColor: '#0f0f0f',
                          color: '#fca5a5',
                          padding: '12px',
                          margin: '8px 0 0 0',
                          borderRadius: '6px',
                          overflow: 'auto',
                          border: '1px solid #374151'
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

          {/* Avisos - Dark Mode */}
          {log.detalhes?.avisos?.length > 0 && (
            <div className="section">
              <h3 style={{color: '#f1f5f9', marginBottom: '16px'}}>⚠️ Avisos ({log.detalhes.avisos.length})</h3>
              <div style={{maxHeight: '250px', overflowY: 'auto'}}>
                {log.detalhes.avisos.map((aviso, idx) => (
                  <div key={idx} style={{
                    marginBottom: '8px',
                    padding: '12px 16px',
                    backgroundColor: '#1f1a0f',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{fontSize: '16px', marginRight: '8px'}}>⚠️</span>
                    <span style={{color: '#fbbf24'}}>Linha {aviso.linha}: {aviso.motivo}</span>
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