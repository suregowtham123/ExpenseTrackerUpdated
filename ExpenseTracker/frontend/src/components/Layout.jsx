import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined';
import SavingsIcon from '@mui/icons-material/SavingsOutlined';
import BarChartIcon from '@mui/icons-material/BarChartOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';

const DRAWER_WIDTH = 232;

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: <DashboardIcon />, end: true },
  { label: 'Transactions', to: '/transactions', icon: <ReceiptIcon />, end: false },
  { label: 'Budgets', to: '/budgets', icon: <SavingsIcon />, end: false },
  { label: 'Reports', to: '/reports', icon: <BarChartIcon />, end: false },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon />, end: false },
];

export default function Layout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <Box role="navigation" aria-label="Main navigation">
      <Toolbar sx={{ gap: 1.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            color: 'secondary.main',
            display: 'grid',
            placeItems: 'center',
            fontFamily: '"Fraunces", serif',
            fontWeight: 700,
          }}
        >
          ₹
        </Box>
        <Typography variant="h6" sx={{ lineHeight: 1.1 }}>
          Ledger
        </Typography>
      </Toolbar>
      <List sx={{ px: 1.5 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.active': { bgcolor: 'primary.main', color: 'primary.contrastText', '& .MuiListItemIcon-root': { color: 'inherit' } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        color="inherit"
        sx={{
          ml: { md: `${DRAWER_WIDTH}px` },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton edge="start" aria-label="Open navigation menu" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div">
            Personal Expense Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop ? true : mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: { md: DRAWER_WIDTH },
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', borderRight: 1, borderColor: 'divider' },
        }}
      >
        {nav}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 } }}>
        <Toolbar />
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
