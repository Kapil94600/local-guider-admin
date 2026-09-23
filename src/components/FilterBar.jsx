// src/components/FilterBar.jsx
import {
  Box,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { COLORS, FONT_BODY } from "../theme/dashboardTheme";

const FilterBar = ({
  searchTerm = "",
  setSearchTerm,
  searchPlaceholder = "Search...",
  filterStatus = [],
  setFilterStatus,
  statusOptions = [],
  dateRange = [null, null],
  setDateRange,
  showDateRange = false,
}) => {
  // ✅ Safe default for dateRange
  const safeDateRange = Array.isArray(dateRange) ? dateRange : [null, null];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 4,
        border: `1px solid ${COLORS.border}`,
        bgcolor: COLORS.bgSurface,
        mb: 2,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={showDateRange ? 4 : 5}>
          <TextField
            fullWidth
            placeholder={searchPlaceholder}
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm?.(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: COLORS.textFaint }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: COLORS.bgSurface,
                "& fieldset": { borderColor: COLORS.border },
                "&:hover fieldset": { borderColor: COLORS.borderStrong },
                "&.Mui-focused fieldset": { borderColor: COLORS.sky },
              },
              fontFamily: FONT_BODY,
            }}
          />
        </Grid>

        {statusOptions.length > 0 && (
          <Grid item xs={12} md={showDateRange ? 3 : 4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={Array.isArray(filterStatus) ? filterStatus : []}
                label="Status"
                onChange={(e) => setFilterStatus?.(e.target.value)}
                renderValue={(selected) => selected.join(", ")}
                sx={{
                  borderRadius: 2,
                  fontFamily: FONT_BODY,
                }}
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
            <Grid item xs={12} md={2.5}>
              <DatePicker
                label="From"
                value={safeDateRange[0]}
                onChange={(newValue) =>
                  setDateRange?.([newValue, safeDateRange[1]])
                }
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        fontFamily: FONT_BODY,
                      },
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={2.5}>
              <DatePicker
                label="To"
                value={safeDateRange[1]}
                onChange={(newValue) =>
                  setDateRange?.([safeDateRange[0], newValue])
                }
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    sx: {
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        fontFamily: FONT_BODY,
                      },
                    },
                  },
                }}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
};

export default FilterBar;