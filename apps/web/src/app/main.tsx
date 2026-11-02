import { render } from 'preact';
import { initApp } from './init';
import { App } from './App';
import './styles/index.css';

initApp();

const root = document.getElementById('app');
if (root) {
  render(<App />, root);
}
