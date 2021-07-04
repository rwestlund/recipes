import { StrictMode } from 'react';
import { render } from 'react-dom';
import { App } from './components/App';

if (module.hot) module.hot.accept();

render(<StrictMode><App /></StrictMode>, document.getElementById('root'));
