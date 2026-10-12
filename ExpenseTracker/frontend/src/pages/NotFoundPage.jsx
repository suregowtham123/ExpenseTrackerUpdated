import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

export default function NotFoundPage() {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Typography variant="h2" component="p" color="primary" sx={{ fontFamily: '"Fraunces", serif', fontWeight: 700 }}>
        404
      </Typography>
      <Typography variant="h5" component="h1" gutterBottom>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        The page you are looking for does not exist.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Back to Dashboard
      </Button>
    </Box>
  );
}
