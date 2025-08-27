import { useState } from 'react';

export default function Debug() {
  const [apiResult, setApiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setApiResult({
        status: response.status,
        data
      });
    } catch (error) {
      setApiResult({
        status: 'error',
        data: { error: error.message }
      });
    }
    setLoading(false);
  };

  const testPrompts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/prompts');
      const data = await response.json();
      setApiResult({
        status: response.status,
        data
      });
    } catch (error) {
      setApiResult({
        status: 'error',
        data: { error: error.message }
      });
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Debug API</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testAPI} disabled={loading} style={{ marginRight: '10px', padding: '10px' }}>
          {loading ? 'Testing...' : 'Test Database Connection'}
        </button>
        <button onClick={testPrompts} disabled={loading} style={{ padding: '10px' }}>
          {loading ? 'Testing...' : 'Test Prompts API'}
        </button>
      </div>

      {apiResult && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px',
          border: apiResult.status >= 400 ? '2px solid red' : '2px solid green'
        }}>
          <h3>Status: {apiResult.status}</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {JSON.stringify(apiResult.data, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '20px', background: '#e8f4f8', borderRadius: '8px' }}>
        <h3>🛠️ Troubleshooting Steps:</h3>
        <ol>
          <li>Test database connection first</li>
          <li>If connection fails - check environment variables in Vercel</li>
          <li>If connection works but no data - check migration</li>
          <li>If data exists but prompts API fails - check API logic</li>
        </ol>
      </div>
    </div>
  );
}
