import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReviewById, clearSelected } from '../redux/slices/reviewSlice';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Chip,
  Grid,
  Rating,
} from '@mui/material';

const ReviewDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading } = useSelector((state) => state.reviews);

  useEffect(() => {
    dispatch(fetchReviewById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  if (loading) return <CircularProgress />;
  if (!selectedItem) return <Typography>Review not found</Typography>;

  return (
    <Box>
      <Button variant="outlined" onClick={() => navigate('/reviews')} sx={{ mb: 2 }}>
        Back
      </Button>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Review #{selectedItem.id}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>User:</strong> {selectedItem.userName || selectedItem.userId}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Target:</strong> {selectedItem.targetName || selectedItem.targetId}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Type:</strong> {selectedItem.targetType || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Rating:</strong>{' '}
                <Rating value={selectedItem.rating} readOnly precision={0.5} />
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1">
                <strong>Comment:</strong> {selectedItem.comment || 'No comment'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Status:</strong>{' '}
                <Chip
                  label={selectedItem.status}
                  color={selectedItem.status === 'approved' ? 'success' : 'default'}
                />
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1">
                <strong>Created At:</strong>{' '}
                {new Date(selectedItem.createdAt).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReviewDetails;