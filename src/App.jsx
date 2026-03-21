import NavBar from './lib/NavBar.jsx'
import HistoricalOptionChain from './lib/HistoricalOptionChain.jsx'
import './app.css'

function App() {
  return (
    <main>
      <NavBar />
      <div className="container">
        <HistoricalOptionChain />
      </div>
    </main>
  )
}

export default App

