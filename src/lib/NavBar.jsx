import { useState } from 'react'
import './NavBar.css'

const REPO_URL = 'https://github.com/AvilPage/historical-option-chain'

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
          <a
            href={REPO_URL}
            className="github-link"
            target="_blank"
            rel="noreferrer"
            aria-label="View source code on GitHub"
            title="Open source on GitHub"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M12 0.5C5.37 0.5 0 5.87 0 12.5C0 17.8 3.44 22.29 8.21 23.88C8.81 23.99 9.03 23.62 9.03 23.3C9.03 23 9.02 22 9.01 20.69C5.67 21.43 4.97 19.07 4.97 19.07C4.42 17.66 3.63 17.28 3.63 17.28C2.55 16.54 3.71 16.56 3.71 16.56C4.9 16.64 5.53 17.8 5.53 17.8C6.59 19.61 8.3 19.09 8.98 18.78C9.09 18 9.39 17.47 9.72 17.16C7.05 16.85 4.24 15.82 4.24 11.24C4.24 9.94 4.7 8.88 5.46 8.04C5.34 7.74 4.94 6.49 5.58 4.8C5.58 4.8 6.59 4.48 8.99 6.12C9.96 5.85 11 5.71 12.04 5.7C13.08 5.71 14.12 5.85 15.09 6.12C17.49 4.48 18.5 4.8 18.5 4.8C19.14 6.49 18.74 7.74 18.62 8.04C19.38 8.88 19.84 9.94 19.84 11.24C19.84 15.83 17.03 16.84 14.35 17.15C14.76 17.51 15.13 18.22 15.13 19.32C15.13 20.9 15.11 22.82 15.11 23.3C15.11 23.62 15.33 24 15.94 23.88C20.71 22.29 24.15 17.8 24.15 12.5C24.15 5.87 18.78 0.5 12.15 0.5H12Z"
                fill="currentColor"
              />
            </svg>
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  )
}

export default NavBar

