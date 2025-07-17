import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import './index.css'
import App from './App'

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#282c34',
      paper: '#21252b',
    },
    primary: {
      main: '#61afef', // One Dark Pro blue
    },
    secondary: {
      main: '#c678dd', // One Dark Pro purple
    },
    text: {
      primary: '#abb2bf', // Light gray for primary text
      secondary: '#5c6370', // Medium gray for secondary text
    },
    error: {
      main: '#e06c75', // One Dark Pro red
    },
    warning: {
      main: '#d19a66', // One Dark Pro orange
    },
    success: {
      main: '#98c379', // One Dark Pro green
    },
    info: {
      main: '#56b6c2', // One Dark Pro cyan
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#282c34',
          color: '#abb2bf',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#21252b',
          backgroundImage: 'none',
        },
      },
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

const root = createRoot(rootElement)
root.render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>
)
