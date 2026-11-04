import { render } from 'preact';
import { initApp } from './init';
import { App } from './App';
import { schedulePrefetch } from './prefetch';
import { contentSetting } from '@/entities/settings';
import { startRouter } from '@/shared/lib';
import './styles/index.css';

initApp();
startRouter();

const root = document.getElementById('app');
if (root) {
  render(<App />, root);
  // After the first render: fetch the other screens and the content chunks while the CPU is idle.
  schedulePrefetch(() => contentSetting.value);
}
