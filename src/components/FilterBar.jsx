import { Box, Paper, Typography, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { Search } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { COLORS, FONT_BODY } from '../theme/dashboardTheme';

const FilterBar = ({
  searchTerm,
  setSearchTerm,
  searchPlaceholder = 'Search...',
  filterStatus,
  setFilterStatus,
  statusOptions = [],
  dateRange,
  setDateRange,
  showDateRange = false,
}) => {
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${COLORS.border}`, bgcolor: COLORS.bgSurface, mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder={searchPlaceholder}
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: COLORS.textFaint }} />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        {statusOptions.length > 0 && (
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
                renderValue={(selected) => selected.join(', ')}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        {showDateRange && (
          <>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="From"
                value={dateRange[0]}
                onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="To"
                value={dateRange[1]}
                onChange={(newValue) => setDateRange([dateRange[0], newValue])}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default FilterBar;