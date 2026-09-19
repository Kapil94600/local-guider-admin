// src/components/Navbar.jsx
import { useSelector } from 'react-redux';
import { Box, Typography, Avatar, Stack } from '@mui/material';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);

  const userInitial =
    user?.firstName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'A';
  const userName = user?.firstName || user?.name || 'Admin';

  return (
    <Box
      sx={{
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e8ecf3',
        px: { xs: 2, md: 3 },
        py: 1.5,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography
        sx={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#0f172a',
          letterSpacing: '-0.01em',
        }}
      >
        Dashboard
      </Typography>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Typography
          sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#475569',
          }}
        >
          {userName}
        </Typography>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: '0.8rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          }}
        >
          {userInitial}
        </Avatar>
      </Stack>
    </Box>
  );
};

export default Navbar;