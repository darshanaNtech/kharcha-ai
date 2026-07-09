import { useState, useEffect } from 'react';
import ExpenseChart from "./ExpenseChart";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [transcript, setTranscript] = useState(""); 
  const [isListening, setIsListening] = useState(false); 
  const [isScanning, setIsScanning] = useState(false);

  // We wrap this in useCallback so ESLint knows it is safe to use in useEffect
  const loadExpenses = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5001/api/expenses");
      const realData = await response.json();
      setExpenses(realData); 
    } catch (error) {
      console.error("Failed to load expenses from database:", error);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, []); // Now ESLint is happy!

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support voice AI. Please use Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event) => {
      const spokenText = event.results[0][0].transcript;
      setTranscript(spokenText); 

      try {
        const aiResponse = await fetch("http://localhost:5001/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: spokenText })
        });
        
        if (!aiResponse.ok) {
          throw new Error(`Backend AI route returned status ${aiResponse.status}`);
        }
        
        const aiData = await aiResponse.json();

        const jsonMatch = aiData.result.match(/\{([\s\S]*)\}/);
        if (!jsonMatch) {
          throw new Error("AI response format invalid. No JSON object block found.");
        }
        const extractedExpense = JSON.parse(jsonMatch[0]);

        const saveResponse = await fetch("http://localhost:5001/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(extractedExpense)
        });

        if (!saveResponse.ok) {
          throw new Error(`Database save route returned status ${saveResponse.status}`);
        }

        loadExpenses();
      } catch (error) {
        console.error("Pipeline Error Trace:", error);
        alert("🚨 Pipeline Error: " + error.message);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsScanning(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result.split(',')[1];

      try {
        const response = await fetch('http://localhost:5001/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64String })
        });

        const data = await response.json();
        alert("🎉 AI Successfully Scanned:\n" + data.result);
        loadExpenses(); 
      } catch (error) {
        console.error("Scanning failure:", error);
        alert("Failed to scan receipt.");
      } finally {
        setIsScanning(false);
      }
    };
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!nameInput || !amountInput) return;

    const newExpense = {
      category: nameInput, 
      amount: parseFloat(amountInput)
    };

    try {
      await fetch("http://localhost:5001/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense)
      });
      setNameInput('');
      setAmountInput('');
      loadExpenses(); 
    } catch (error) {
      console.error("Failed to add manual expense:", error);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await fetch(`http://localhost:5001/api/expenses/${id}`, {
        method: "DELETE"
      });
      loadExpenses(); 
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  return (
    <div style={styles.phoneWrapper}>
      <div style={styles.phoneContainer}>
        <div style={styles.statusBar}></div>
        <h1 style={styles.title}>Kharcha-AI</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '15px 0', gap: '15px' }}>
          <button
            onClick={startListening}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isListening ? '#ef4444' : '#2563eb',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            {isListening ? "Listening..." : "Record"}
          </button>

          <div>
            <label style={{
              cursor: 'pointer',
              backgroundColor: '#cbd5e1',
              color: '#1e293b',
              fontWeight: '600',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              display: 'inline-block'
            }}>
              {isScanning ? "Scanning Image... " : "📸 Upload Receipt"}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {transcript && (
            <p style={styles.transcriptBox}>You said: "{transcript}"</p>
          )}
        </div>

        <ExpenseChart />

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Recent Spending (Click item to delete)</h2>
          <div style={styles.listContainer}>
            {expenses.map(item => (
              <div key={item.id} style={styles.row} onClick={() => handleDeleteExpense(item.id)}>
                <span style={styles.itemName}>❌ {item.category}</span>
                <span style={styles.itemAmount}>- ₹{item.amount}</span>
              </div>
            ))}
          </div>

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
      </div>
    </div>
  );
}

const styles = {
  phoneWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: '"Inter", sans-serif', margin: 0, padding: '20px' },
  phoneContainer: { width: '360px', height: '740px', backgroundColor: '#f8fafc', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', padding: '24px', boxSizing: 'border-box', position: 'relative', overflowY: 'auto' },
  statusBar: { height: '20px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#0f172a', textAlign: 'center', margin: '5px 0 10px 0' },
  card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', height: '380px', marginTop: '20px' },
  cardTitle: { fontSize: '11px', fontWeight: '600', color: '#94a3b8', margin: '0 0 12px 0', textTransform: 'uppercase' },
  listContainer: { display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1, overflowY: 'auto' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', cursor: 'pointer' },
  itemName: { fontSize: '14px', fontWeight: '500', color: '#1e293b', textTransform: 'capitalize' },
  itemAmount: { fontSize: '14px', fontWeight: '600', color: '#ef4444' },
  form: { display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '2px dashed #e2e8f0', paddingTop: '10px' },
  formRow: { display: 'flex', gap: '6px' },
  input: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc' },
  addButton: { padding: '8px 16px', borderRadius: '8px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', fontWeight: '600', cursor: 'pointer' },
  transcriptBox: { marginTop: '5px', fontSize: '14px', color: '#374151', backgroundColor: 'white', padding: '10px', borderRadius: '8px', textAlign: 'center', borderLeft: '4px solid #2563eb' }
};

export default App;