import { useState } from 'react'
import './App.css'
import { sendChatRequest, sendQuickChatRequest } from './lib/api'

interface Response {
  type: 'chat' | 'quickchat';
  timestamp: string;
  query: string;
  data: unknown;
}

function App() {
  const [query, setQuery] = useState('')
  const [isDetailedResponseNeeded, setIsDetailedResponseNeeded] = useState(false)
  const [isVisualizationNeeded, setIsVisualizationNeeded] = useState(false)
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setError('Please enter a query')
      return
    }

    setLoading(true)
    setError(null)

    const result = await sendChatRequest(query, isDetailedResponseNeeded, isVisualizationNeeded)
    
    if (result.success && result.response) {
      setResponses(prev => [{
        type: 'chat',
        timestamp: new Date().toLocaleTimeString(),
        query,
        data: result.response
      }, ...prev])
      setQuery('')
    } else {
      setError(result.message || result.error || 'Failed to get response')
    }
    
    setLoading(false)
  }

  const handleQuickChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setError('Please enter a query')
      return
    }

    setLoading(true)
    setError(null)

    const result = await sendQuickChatRequest(query, isVisualizationNeeded)
    
    if (result.response) {
      setResponses(prev => [{
        type: 'quickchat',
        timestamp: new Date().toLocaleTimeString(),
        query,
        data: result.response
      }, ...prev])
      setQuery('')
    } else {
      setError(result.error || 'Failed to get response')
    }
    
    setLoading(false)
  }

  return (
    <div className="app-container">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">INGRES Chat Interface</h1>
            <p className="text-gray-600">Query your data with AI-powered responses</p>
          </div>

          {/* Chat Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chat Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Query</h2>
              
              <form onSubmit={handleChatSubmit} className="space-y-4">
                {/* Query Input */}
                <div>
                  <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                    Query
                  </label>
                  <textarea
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your question about the data..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDetailedResponseNeeded}
                      onChange={(e) => setIsDetailedResponseNeeded(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Detailed Response</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVisualizationNeeded}
                      onChange={(e) => setIsVisualizationNeeded(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Charts</span>
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    }`}
                  >
                    {loading ? 'Sending...' : 'Full Chat'}
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickChatSubmit}
                    disabled={loading}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                    }`}
                  >
                    {loading ? 'Sending...' : 'Quick Chat'}
                  </button>
                </div>
              </form>
            </div>

            {/* Response Display */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Responses</h2>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {responses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No responses yet. Submit a query to get started!</p>
                ) : (
                  responses.map((res, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-lg border-l-4 ${
                        res.type === 'chat' 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-indigo-50 border-indigo-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          res.type === 'chat'
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-indigo-200 text-indigo-800'
                        }`}>
                          {res.type === 'chat' ? 'FULL CHAT' : 'QUICK CHAT'}
                        </span>
                        <span className="text-xs text-gray-500">{res.timestamp}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">Query: {res.query}</p>
                      <div className="bg-white rounded p-3 overflow-x-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                          {JSON.stringify(res.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
