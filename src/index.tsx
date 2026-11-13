/* @refresh reload */
import { render } from 'solid-js/web';
import '@fontsource-variable/syne';
import '@fontsource-variable/manrope';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './styles/global.css';
import { applyTheme, themeName } from './lib/theme';
import App from './App';

// Apply theme variables before the first paint.
applyTheme(themeName());

render(() => <App />, document.getElementById('root')!);
