import { createTheme } from '@mui/material/styles';

// Ledger-inspired palette: deep green ink, warm paper background, amber accent.
export const CHART_COLORS = ['#0f5c52', '#f5b942', '#3b82a0', '#c2543a', '#7a6bb0', '#5aa469', '#d98ca3', '#8a8f98'];

export function buildTheme(mode) {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? '#4fb3a3' : '#0f5c52' },
      secondary: { main: '#f5b942' },
      success: { main: dark ? '#5fc48a' : '#1f8a52' },
      error: { main: dark ? '#f08070' : '#c2392b' },
      background: dark ? { default: '#101614', paper: '#18211e' } : { default: '#f6f3ec', paper: '#ffffff' },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
      h4: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 700 },
      h5: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 700 },
      h6: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCard: { defaultProps: { variant: 'outlined' } },
      MuiButton: { defaultProps: { disableElevation: true } },
    },
  });
}
