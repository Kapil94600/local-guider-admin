import { CircularProgress, Box } from '@mui/material';

const Loader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
    <CircularProgress />
  </Box>
);

export default Loader;