import React, { useState, useEffect } from 'react';

const PricingCalculator = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [numClients, setNumClients] = useState(1);
  const [clients, setClients] = useState([
    { name: '', tier: 'gold', transactions: 0, statements: 0 }
  ]);
  const [results, setResults] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [errors, setErrors] = useState({});

  const tiers = {
    gold: { name: 'Gold Tier', transaction: 26, statement: 160, discount: 0.20 },
    silver: { name: 'Silver Tier', transaction: 22, statement: 160, discount: 0.20 },
    bronze: { name: 'Bronze Tier', transaction: 18, statement: 160, discount: 0.20 }
  };

  const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/t0lmdbr5ereld3rwwc7fw910x5cmpa6b';

  useEffect(() => {
    generateClientTable();
  }, [numClients]);

  const generateClientTable = () => {
    const newClients = Array.from({ length: numClients }, (_, i) => ({
      name: clients[i]?.name || '',
      tier: clients[i]?.tier || 'gold',
      transactions: clients[i]?.transactions || 0,
      statements: clients[i]?.statements || 0
    }));
    setClients(newClients);
  };

  const updateClient = (index, field, value) => {
    const newClients = [...clients];
    newClients[index] = { ...newClients[index], [field]: value };
    setClients(newClients);
    
    // Clear client name error when user starts typing
    if (field === 'name' && value.trim()) {
      setErrors(prev => ({ ...prev, [`client-${index}`]: false }));
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const showStatus = (message, type) => {
    setStatusMessage({ text: message, type });
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
  };

  const calculateCosts = () => {
    // Clear previous errors
    setErrors({});
    
    // Validation
    const newErrors = {};
    
    if (!companyName.trim()) {
      newErrors.companyName = true;
      showStatus('Please enter a company name', 'error');
      return;
    }
    
    if (!companyEmail.trim()) {
      newErrors.companyEmail = true;
      showStatus('Please enter an email address', 'error');
      return;
    }
    
    if (!validateEmail(companyEmail)) {
      newErrors.companyEmail = true;
      showStatus('Please enter a valid email address', 'error');
      return;
    }
    
    // Validate client names
    let hasEmptyClientName = false;
    clients.forEach((client, index) => {
      if (!client.name.trim()) {
        newErrors[`client-${index}`] = true;
        hasEmptyClientName = true;
      }
    });
    
    if (hasEmptyClientName) {
      setErrors(newErrors);
      showStatus('Please enter names for all clients', 'error');
      return;
    }
    
    // Calculate costs
    const clientsData = clients.map(client => {
      const tierData = tiers[client.tier];
      const transactionCost = client.transactions * tierData.transaction;
      const statementCost = client.statements * tierData.statement;
      const subtotal = transactionCost + statementCost;
      const discountAmount = subtotal * tierData.discount;
      const totalCost = subtotal - discountAmount;
      
      return {
        ...client,
        tierName: tierData.name,
        transactionCost,
        statementCost,
        subtotal,
        discountAmount,
        totalCost
      };
    });
    
    const totals = {
      transactionCost: clientsData.reduce((sum, client) => sum + client.transactionCost, 0),
      statementCost: clientsData.reduce((sum, client) => sum + client.statementCost, 0),
      subtotal: clientsData.reduce((sum, client) => sum + client.subtotal, 0),
      discountAmount: clientsData.reduce((sum, client) => sum + client.discountAmount, 0),
      grandTotal: clientsData.reduce((sum, client) => sum + client.totalCost, 0)
    };
    
    setResults({
      companyName,
      companyEmail,
      clients: clientsData,
      totals,
      timestamp: new Date().toISOString()
    });
    
    showStatus('Calculation completed successfully!', 'success');
  };

  const downloadCSV = () => {
    if (!results) {
      showStatus('Please calculate costs first', 'error');
      return;
    }

    try {
      let csvContent = 'Client Name,Tier,Transactions,Supplier Statements,Transaction Cost,Supplier Recon Cost,Subtotal,Discount Amount,Total\n';
      
      results.clients.forEach(client => {
        const row = [
          `"${client.name}"`,
          client.tier.charAt(0).toUpperCase() + client.tier.slice(1),
          client.transactions,
          client.statements,
          client.transactionCost,
          client.statementCost,
          client.subtotal,
          client.discountAmount,
          client.totalCost
        ];
        csvContent += row.join(',') + '\n';
      });
      
      const totalRow = [
        '"TOTAL"',
        '-',
        results.clients.reduce((sum, client) => sum + client.transactions, 0),
        results.clients.reduce((sum, client) => sum + client.statements, 0),
        results.totals.transactionCost,
        results.totals.statementCost,
        results.totals.subtotal,
        results.totals.discountAmount,
        results.totals.grandTotal
      ];
      csvContent += totalRow.join(',') + '\n';
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pricing-quote-${results.companyName.replace(/[^a-zA-Z0-9]/g, '-')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showStatus('CSV downloaded successfully!', 'success');
    } catch (error) {
      showStatus('Error generating CSV. Please try again.', 'error');
    }
  };

  const submitData = async () => {
    if (!results) {
      showStatus('Please calculate costs first', 'error');
      return;
    }

    const webhookData = {
      companyName: results.companyName,
      companyEmail: results.companyEmail,
      dateSubmitted: new Date().toISOString(),
      quotes: results.clients.map((client, index) => ({
        quoteId: index + 1,
        clientName: client.name,
        tier: client.tier,
        tierName: client.tierName,
        transactions: client.transactions,
        statements: client.statements,
        transactionCost: client.transactionCost,
        statementCost: client.statementCost,
        subtotal: client.subtotal,
        discountAmount: client.discountAmount,
        totalCost: client.totalCost
      })),
      totals: results.totals,
      timestamp: results.timestamp
    };

    showStatus('Submitting quote via Make automation...', 'success');

    try {
      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      if (!response.ok) {
        throw new Error(`Make webhook request failed with status: ${response.status}`);
      }

      showStatus('Quote submitted successfully!', 'success');
    } catch (error) {
      showStatus(`Error submitting via Make: ${error.message}`, 'error');
      console.error('Make webhook error:', error);
    }
  };

  const TierCard = ({ tier, tierKey }) => (
    <div className={`tier-card ${tierKey}`}>
      <h4>{tier.name}</h4>
      <div className="tier-details">
        <span>Per Transaction:</span>
        <span>R{tier.transaction}</span>
      </div>
      <div className="tier-details">
        <span>Supplier Recon to Statement:</span>
        <span>R{tier.statement}</span>
      </div>
      <div className="tier-details">
        <span>Engine Room Fee Discount:</span>
        <span className="savings">-{(tier.discount * 100)}%</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-blue-600 p-2.5 flex items-center justify-center">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl max-w-5xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-5">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2">
            Virtual Engine Room Bookkeeping
          </h1>
          <h2 className="text-2xl font-bold text-slate-800">Pricing Calculator</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <label className="block mb-2 font-semibold text-slate-800">Company Name *:</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (e.target.value.trim()) setErrors(prev => ({ ...prev, companyName: false }));
              }}
              placeholder="Enter company name"
              className={`w-full p-3 border-2 rounded-lg text-base transition-all duration-300 bg-white/80 ${
                errors.companyName ? 'border-red-500 shadow-red-100' : 'border-slate-300 focus:border-blue-600'
              } focus:outline-none focus:shadow-lg`}
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-slate-800">Email Address *:</label>
            <input
              type="email"
              value={companyEmail}
              onChange={(e) => {
                setCompanyEmail(e.target.value);
                if (e.target.value.trim()) setErrors(prev => ({ ...prev, companyEmail: false }));
              }}
              placeholder="Enter email address"
              className={`w-full p-3 border-2 rounded-lg text-base transition-all duration-300 bg-white/80 ${
                errors.companyEmail ? 'border-red-500 shadow-red-100' : 'border-slate-300 focus:border-blue-600'
              } focus:outline-none focus:shadow-lg`}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold text-slate-800">Number of Clients:</label>
          <input
            type="number"
            value={numClients}
            onChange={(e) => setNumClients(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            min="1"
            max="50"
            className="w-full p-3 border-2 border-slate-300 rounded-lg text-base transition-all duration-300 bg-white/80 focus:border-blue-600 focus:outline-none focus:shadow-lg"
          />
        </div>

        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="p-3 text-left text-slate-800 font-semibold text-sm">Client Name</th>
                  <th className="p-3 text-left text-slate-800 font-semibold text-sm">Tier</th>
                  <th className="p-3 text-left text-slate-800 font-semibold text-sm">Transactions</th>
                  <th className="p-3 text-left text-slate-800 font-semibold text-sm">Supplier Statements</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3 border-b border-slate-200">
                      <input
                        type="text"
                        value={client.name}
                        onChange={(e) => updateClient(index, 'name', e.target.value)}
                        placeholder={`Client ${index + 1} name`}
                        className={`w-full p-2 border rounded text-sm ${
                          errors[`client-${index}`] ? 'border-red-500' : 'border-slate-300 focus:border-blue-600'
                        } focus:outline-none`}
                      />
                    </td>
                    <td className="p-3 border-b border-slate-200">
                      <select
                        value={client.tier}
                        onChange={(e) => updateClient(index, 'tier', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-sm bg-white cursor-pointer focus:border-blue-600 focus:outline-none"
                      >
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                        <option value="bronze">Bronze</option>
                      </select>
                    </td>
                    <td className="p-3 border-b border-slate-200">
                      <input
                        type="number"
                        value={client.transactions}
                        onChange={(e) => updateClient(index, 'transactions', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                    <td className="p-3 border-b border-slate-200">
                      <input
                        type="number"
                        value={client.statements}
                        onChange={(e) => updateClient(index, 'statements', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full p-2 border border-slate-300 rounded text-sm focus:border-blue-600 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <button
            onClick={calculateCosts}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Calculate
          </button>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-5 border-l-4 border-blue-600">
          <h3 className="text-slate-800 mb-2.5 text-lg font-semibold">Tier Pricing Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(tiers).map(([key, tier]) => (
              <TierCard key={key} tier={tier} tierKey={key} />
            ))}
          </div>
        </div>

        {results && (
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-5 mb-5 border border-slate-200 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="p-2.5 text-left text-slate-800 font-semibold text-sm">Client</th>
                    <th className="p-2.5 text-left text-slate-800 font-semibold text-sm">Tier</th>
                    <th className="p-2.5 text-left text-slate-800 font-semibold text-sm">Transaction Cost</th>
                    <th className="p-2.5 text-left text-slate-800 font-semibold text-sm">Supplier Recon Cost</th>
                    <th className="p-2.5 text-left text-slate-800 font-semibold text-sm">Subtotal</th>
                    <th className="p-2.5 text-left text-slate-800 font-semibold text-sm">Discount</th>
                    <th className="p-2.5 text-left text-slate-800 font-semibold text-sm">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {results.clients.map((client, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-2.5 border-b border-slate-200">{client.name}</td>
                      <td className="p-2.5 border-b border-slate-200">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase text-white ${
                          client.tier === 'gold' ? 'bg-slate-800' : 
                          client.tier === 'silver' ? 'bg-blue-600' : 'bg-amber-600'
                        }`}>
                          {client.tier}
                        </span>
                      </td>
                      <td className="p-2.5 border-b border-slate-200">R{client.transactionCost.toLocaleString()}</td>
                      <td className="p-2.5 border-b border-slate-200">R{client.statementCost.toLocaleString()}</td>
                      <td className="p-2.5 border-b border-slate-200">R{client.subtotal.toLocaleString()}</td>
                      <td className="p-2.5 border-b border-slate-200 text-green-600 font-bold">
                        -R{client.discountAmount.toLocaleString()}
                      </td>
                      <td className="p-2.5 border-b border-slate-200 font-bold">
                        R{client.totalCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-800">
                    <td className="p-2.5 font-bold">TOTAL</td>
                    <td className="p-2.5 font-bold">-</td>
                    <td className="p-2.5 font-bold">R{results.totals.transactionCost.toLocaleString()}</td>
                    <td className="p-2.5 font-bold">R{results.totals.statementCost.toLocaleString()}</td>
                    <td className="p-2.5 font-bold">R{results.totals.subtotal.toLocaleString()}</td>
                    <td className="p-2.5 font-bold text-green-600">-R{results.totals.discountAmount.toLocaleString()}</td>
                    <td className="p-2.5 font-bold">R{results.totals.grandTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <button
            onClick={downloadCSV}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:bg-green-700 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Download CSV
          </button>
          <button
            onClick={submitData}
            className="flex-1 bg-slate-800 text-white py-3 px-4 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:bg-slate-900 hover:-translate-y-0.5 hover:shadow-lg"
          >
            Submit Quote
          </button>
        </div>

        {statusMessage.text && (
          <div className={`p-3 rounded-lg text-center font-semibold text-sm ${
            statusMessage.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {statusMessage.text}
          </div>
        )}
      </div>

      <style jsx>{`
        .tier-card {
          background: white;
          border-radius: 0.5rem;
          padding: 1rem;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        
        .tier-card.gold {
          border-color: #1e293b;
        }
        
        .tier-card.silver {
          border-color: #2563eb;
        }
        
        .tier-card.bronze {
          border-color: #d97706;
        }
        
        .tier-card h4 {
          margin-bottom: 0.625rem;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .tier-card.gold h4 {
          color: #1e293b;
        }
        
        .tier-card.silver h4 {
          color: #2563eb;
        }
        
        .tier-card.bronze h4 {
          color: #d97706;
        }
        
        .tier-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.375rem;
          font-size: 0.875rem;
        }
        
        .tier-details:last-child {
          margin-bottom: 0;
        }
        
        .savings {
          color: #16a34a;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default PricingCalculator;