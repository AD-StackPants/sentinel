import OperationalDashboard from './components/OperationalDashboard/OperationalDashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="bg-blue-600 text-white p-4 shadow">
        <h1 className="text-2xl font-bold">Sentinel AI - Emergency Operations Copilot</h1>
      </header>
      <main style={{ height: 'calc(100vh - 64px)' }}>
        <OperationalDashboard />
      </main>
    </div>
  );
}

export default App;
