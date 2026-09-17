import { Skeleton, Box, Grid, Paper } from '@mui/material';

const SkeletonLoader = ({ type = 'table', count = 6 }) => {
  if (type === 'stats') {
    return (
      <Grid container spacing={3}>
        {[...Array(count)].map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="40%" height={30} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (type === 'card') {
    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={150} height={40} borderRadius={2} />
        </Box>
        <Skeleton variant="rectangular" height={400} borderRadius={2} />
      </Paper>
    );
  }

  // Default: table skeleton
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" width={150} height={40} borderRadius={2} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rectangular" height={50} sx={{ mb: 1 }} />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    </Paper>
  );
};

export default SkeletonLoader;