import { Box, Card, CardContent, Typography } from '@mui/material';

export default function StatCard({ title, value, icon, color = 'primary.main', caption }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            bgcolor: color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h5" noWrap>
            {value}
          </Typography>
          {caption && (
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
