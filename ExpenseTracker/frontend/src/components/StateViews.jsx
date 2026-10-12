import { Alert, Box, Button, CircularProgress } from '@mui/material';

export function LoadingState() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
      <CircularProgress aria-label="Loading" />
    </Box>
  );
}

export function ErrorAlert({ message, onRetry }) {
  return (
    <Alert
      severity="error"
      sx={{ mb: 2 }}
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}
