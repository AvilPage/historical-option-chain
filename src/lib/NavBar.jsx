import { useState } from 'react'
import './NavBar.css'

function NavBar() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <nav>
      <div className="nav-container">
        <div className="logo">
          <span className="icon">📊</span>
          <span className="title">Historical Option Chain</span>
        </div>
        <div className="nav-links">
          <a
            href="#home"
            className={activeTab === 'home' ? 'active' : ''}
            onClick={() => setActiveTab('home')}
          >
            Home
          </a>
          <a
            href="#about"
            className={activeTab === 'about' ? 'active' : ''}
            onClick={() => setActiveTab('about')}
          >
            About
          </a>
        </div>
      </div>
    </nav>
  )
}

export default NavBar

