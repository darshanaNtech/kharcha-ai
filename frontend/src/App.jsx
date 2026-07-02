import React, { useState, useEffect } from 'react';

function App() {
  // 1. Core State Hooks (Initializes from LocalStorage memory if it exists)
  const [expenses, setExpenses] = useState(() => {
    const savedMemory = localStorage.getItem('kharcha_expenses');
    return savedMemory ? JSON.parse(savedMemory) : [
      { id: 1, name: 'Tea & Samosa', amount: 50 },
      { id: 2, name: 'Auto Ride', amount: 120 }
    ];
  });
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');

  // 2. Synchronization Hook: Automatically saves to memory whenever state changes
  useEffect(() => {
    localStorage.setItem('kharcha_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // 3. Action Handler: Add New Expense
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!nameInput || !amountInput) return;

    const newExpense = {
      id: Date.now(),
      name: nameInput,
      amount: parseFloat(amountInput)
    };

    setExpenses([newExpense, ...expenses]);
    setNameInput('');
    setAmountInput('');
  };

  // 4. Action Handler: Delete Specific Expense
  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(item => item.id !== id));
  };

  return (
    <div style={styles.phoneWrapper}>
      <div style={styles.phoneContainer}>
        <div style={styles.statusBar}></div>
        <h1 style={styles.title}>Kharcha-AI</h1>

        {/* Recent Spending Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Recent Spending (Click item to delete)</h2>
          
          {/* List Component */}
          <div style={styles.listContainer}>
            {expenses.map(item => (
              <div 
                key={item.id} 
                style={styles.row} 
                onClick={() => handleDeleteExpense(item.id)}
                title="Click to delete"
              >
                <span style={styles.itemName}>❌ {item.name}</span>
                <span style={styles.itemAmount}>- ₹{item.amount}</span>
              </div>
            ))}
            {expenses.length === 0 && (
              <p style={styles.emptyText}>No expenses logged yet! 💸</p>
            )}
          </div>

          {/* Quick Manual Input Form */}
          <form onSubmit={handleAddExpense} style={styles.form}>
            <input 
              type="text" 
              placeholder="Expense Name (e.g., Momos)" 
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={styles.input}
              required
            />
            <div style={styles.formRow}>
              <input 
                type="number" 
                placeholder="Amount (₹)" 
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                style={{...styles.input, flexGrow: 1}}
                required
              />
              <button type="submit" style={styles.addButton}>Add</button>
            </div>
          </form>
        </div>

        {/* Bottom Voice Action Trigger */}
        <div style={styles.actionArea}>
          <button 
            type="button"
            style={styles.micButton} 
            onClick={() => alert("Voice processing and Python AI engine integrations start tomorrow on Day 2!")}
          >
            🎤
          </button>
          <p style={styles.micLabel}>Record Expense</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  phoneWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    fontFamily: '"Inter", sans-serif',
    margin: 0,
    padding: '20px'
  },
  phoneContainer: {
    width: '360px',
    height: '740px',
    backgroundColor: '#f8fafc',
    borderRadius: '32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden'
  },
  statusBar: { height: '20px' },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    marginTop: '10px',
    marginBottom: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    height: '420px'
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#94a3b8',
    margin: '0 0 16px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flexGrow: 1,
    overflowY: 'auto',
    marginBottom: '16px'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '10px',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  itemName: { fontSize: '15px', fontWeight: '500', color: '#1e293b' },
  itemAmount: { fontSize: '15px', fontWeight: '600', color: '#ef4444' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginTop: '20px' },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderTop: '2px dashed #e2e8f0',
    paddingTop: '14px'
  },
  formRow: { display: 'flex', gap: '8px' },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f8fafc'
  },
  addButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer'
  },
  actionArea: {
    position: 'absolute',
    bottom: '24px',
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  micButton: {
    width: '68px',
    height: '68px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    border: 'none',
    color: '#ffffff',
    fontSize: '26px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
  },
  micLabel: { fontSize: '13px', fontWeight: '600', color: '#64748b', margin: 0 }
};

export default App;