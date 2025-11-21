import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import ClientesPage from './pages/ClientesPage'
import VeiculosPage from './pages/VeiculosPage'
import FaturamentoPage from './pages/FaturamentoPage'
import CsvUploadPage from './pages/CsvUploadPage'
import './styles.css'

const qc = new QueryClient()

function Layout(){
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Clientes', icon: '👥' },
    { path: '/veiculos', label: 'Veículos', icon: '🚗' },
    { path: '/faturamento', label: 'Faturamento', icon: '💰' },
    { path: '/csv', label: 'Importar CSV', icon: '📤' }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f1f5f9'
    }}>
      {/* Header/Navbar */}
      <header style={{
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #374151',
        padding: '0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px'
        }}>
          {/* Logo/Title */}
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: '#60a5fa',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🅿️ PHCA Parking System
          </h1>

          {/* Navigation */}
          <nav style={{
            display: 'flex',
            gap: '4px'
          }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link 
                  key={item.path}
                  to={item.path}
                  style={{
                    textDecoration: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    backgroundColor: isActive ? '#3b82f6' : 'transparent',
                    color: isActive ? '#ffffff' : '#d1d5db',
                    border: isActive ? 'none' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor = '#374151'
                      e.target.style.color = '#f9fafb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.backgroundColor = 'transparent'
                      e.target.style.color = '#d1d5db'
                    }
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        minHeight: 'calc(100vh - 80px)', // Subtrair altura do header
        backgroundColor: '#0f172a'
      }}>
        <Routes>
          <Route path="/" element={<ClientesPage/>}/>
          <Route path="/veiculos" element={<VeiculosPage/>}/>
          <Route path="/faturamento" element={<FaturamentoPage/>}/>
          <Route path="/csv" element={<CsvUploadPage/>}/>
        </Routes>
      </main>

      {/* Footer opcional */}
      <footer style={{
        backgroundColor: '#1e293b',
        borderTop: '1px solid #374151',
        padding: '16px 20px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          © 2024 PHCA Parking System - Sistema de Gerenciamento de Estacionamento
        </div>
      </footer>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={qc}>
    <BrowserRouter>
      <Layout/>
    </BrowserRouter>
  </QueryClientProvider>
)