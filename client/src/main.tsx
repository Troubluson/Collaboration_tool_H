import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import Messages from './components/Messages';

ReactDOM.render(
  <React.StrictMode>
    <Messages />
  </React.StrictMode>,
  document.getElementById('root'),
);
