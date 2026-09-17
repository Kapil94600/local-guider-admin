import { Alert } from '@mui/material';

const ErrorAlert = ({ error }) => {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message || 'Something went wrong';
  return <Alert severity="error">{message}</Alert>;
};

export default ErrorAlert;