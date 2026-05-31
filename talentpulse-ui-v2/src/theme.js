import { createTheme } from '@mui/material/styles';

// Syncing with Tailwind's color palette
export const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "sans-serif"',
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  palette: {
    primary: {
      main: '#7c3aed', // Violet 600
      light: '#a78bfa',
      dark: '#5b21b6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#3b82f6', // Blue 500
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Surface 50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Surface 900
      secondary: '#64748b', // Surface 500
    },
  },
  shape: {
    borderRadius: 12, // Matches modern UI curves
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
});
