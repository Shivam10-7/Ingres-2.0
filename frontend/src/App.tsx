import React, { useState } from 'react'
import './App.css'
import { QuickChat } from './components'
import type{ GroundwaterAssessment, QueryMetadata } from './types'
import Results from './components/Results/Results'

interface AppState {
  results: GroundwaterAssessment[]
  metadata: QueryMetadata | null
}

function App() {
  const [appState, setAppState] = useState<AppState>({
    results: [],
    metadata: null
  })

  const handleQuerySubmit = (results: GroundwaterAssessment[], metadata: QueryMetadata) => {
    setAppState({
      results,
      metadata
    })
  }

  const handleError = (error: string) => {
    console.error('App error:', error)
  }

  return (
    <div className='app-container'>
      <header className='app-header'>
        <h1>INGRES - Groundwater Data Query System</h1>
        <p>National-level groundwater assessment interface for India</p>
      </header>

      <div className='app-content'>
        <div className='query-section'>
          <QuickChat 
            onQuerySubmit={(results) => handleQuerySubmit(results, {} as QueryMetadata)}
            onError={handleError}
          />
        </div>

        {appState.results.length > 0 && (
          <div className='results-section'>
            <Results 
              data={appState.results}
              metadata={appState.metadata}
            />
          </div>
        )}
      </div>

      <footer className='app-footer'>
        <p>&copy; 2026 INGRES Project. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
