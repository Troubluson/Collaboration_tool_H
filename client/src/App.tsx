import './App.css';

import React from 'react';

import Messages from './components/Messages';
import logo from './logo.svg';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p className="header">
          🚀 Vite + React + Typescript 🤘 & <br />
          Eslint 🔥+ Prettier
        </p>

        <div className="body">
          <Messages />
        </div>
      </header>
    </div>
  );
}

export default App;
