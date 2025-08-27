import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Layout from '../components/Layout';

export default function MyPrompts() {
  const { publicKey } = useWallet();
  const [myPrompts, setMyPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (publicKey) {
      fetchMyPrompts();
    }
  }, [publicKey]);

  const fetchMyPrompts = async () => {
    try {
      const response = await fetch(`/api/prompts?owner=${publicKey.toBase58()}`);
      if (response.ok) {
        const data = await response.json();
        setMyPrompts(data);
      }
    } catch (error) {
      console.error('Error fetching my prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">My Prompts</h1>
          <p>Please connect your wallet to view your prompts.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Prompts</h1>
        {loading ? (
          <p>Loading your prompts...</p>
        ) : myPrompts.length === 0 ? (
          <p>You haven't created any prompts yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPrompts.map((prompt) => (
              <div key={prompt.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">{prompt.title}</h3>
                <p className="text-gray-600 mb-4">{prompt.content.substring(0, 100)}...</p>
                <p className="text-lg font-bold text-blue-600">{prompt.priceSol} SOL</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}