import { Snackbar, Alert } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { clearError } from '../redux/slices/authSlice';

const ToastNotification = () => {
  const dispatch = useDispatch();
  const error = useSelector((state) => state.auth.error);

  const handleClose = () => dispatch(clearError());

  return (
    <Snackbar
      open={!!error}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity="error" variant="filled">
        {error}
      </Alert>
    </Snackbar>
  );
};

export default ToastNotification;