// components/ForecastWizard/ColumnSelection.js
"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField, // ✅ Add this import
  Alert,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@mui/material";
import {
  verifyDateAndGroupingUniqueness,
  analyzeAggregationImpact,
} from "../../utils/dataVerification";
import { parseFlexibleDate, formatDateForDisplay } from '../../utils/dateUtils';
import { format } from 'date-fns/format';
import { differenceInSeconds, differenceInDays } from "date-fns";

// Individual icon imports
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CategoryIcon from "@mui/icons-material/Category";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";

const frequencyOptions = [
  { value: "H", label: "Hourly" },
  { value: "D", label: "Daily" },
  { value: "W", label: "Weekly" },
  { value: "M", label: "Monthly" },
  { value: "Q", label: "Quarterly" },
  { value: "Y", label: "Yearly" },
];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 300,
    },
  },
};

// Add this to define valid aggregation paths
const VALID_AGGREGATIONS = {
  H: ["H", "D", "W", "M", "Q", "Y"],
  D: ["D", "W", "M", "Q", "Y"],
  W: ["W", "M", "Q", "Y"],
  M: ["M", "Q", "Y"],
  Q: ["Q", "Y"],
  Y: ["Y"],
};

export default function ColumnSelection({
  data,
  onUpdate,
  onNext,
  onBack,
  setError,
}) {
  console.log("ColumnSelection component received data:", data); // Add this line

  const [selectedColumns, setSelectedColumns] = useState({
    target: "",
    date: "",
    grouping: [],
    frequency: "", // Changed from 'D' to ''
    horizon: "", // Changed from 30 to ''
  });

  const [validationErrors, setValidationErrors] = useState([]);
  const [dateGranularity, setDateGranularity] = useState(null); // Add this state

  // Initialize with existing selections if available
  useEffect(() => {
    if (data.selectedColumns) {
      setSelectedColumns({
        target: data.selectedColumns.target || "",
        date: data.selectedColumns.date || "",
        grouping: data.selectedColumns.grouping || [],
        frequency: data.selectedColumns.frequency || "", // Changed default
        horizon: data.selectedColumns.horizon || "", // Changed default
      });
    }
  }, [data.selectedColumns]);

  // Detect date granularity when date column or raw data changes
  useEffect(() => {
    if (selectedColumns.date && data.rawData) {
      const dateValues = data.rawData.map((row) => row[selectedColumns.date]);
      const detected = detectDateGranularity(dateValues);
      setDateGranularity(detected);

      // If current frequency is invalid for this granularity, reset it
      if (
        selectedColumns.frequency &&
        !VALID_AGGREGATIONS[detected]?.includes(selectedColumns.frequency)
      ) {
        handleColumnChange("frequency", "");
      }
    }
  }, [selectedColumns.date, data.rawData]);

  // Get columns by type from validation results
  const getColumnsByType = (type) => {
    if (!data.validationResults?.columnAnalysis) return [];

    return Object.entries(data.validationResults.columnAnalysis)
      .filter(([, analysis]) => analysis.type === type)
      .map(([columnName]) => columnName);
  };

  const getColumnInfo = (columnName) => {
    return data.validationResults?.columnAnalysis?.[columnName] || {};
  };

  const getColumnTypeIcon = (type) => {
    switch (type) {
      case "date":
        return <CalendarTodayIcon fontSize="small" />;
      case "numeric":
        return <TrendingUpIcon fontSize="small" />;
      case "categorical":
        return <CategoryIcon fontSize="small" />;
      case "binary":
        return <DataUsageIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const getColumnTypeColor = (type) => {
    switch (type) {
      case "date":
        return "info";
      case "numeric":
        return "success";
      case "categorical":
        return "secondary";
      case "binary":
        return "warning";
      default:
        return "default";
    }
  };

  const handleColumnChange = (columnType, value) => {
    console.log("🎯 handleColumnChange called:", { columnType, value });
    const newSelection = { ...selectedColumns, [columnType]: value };
    console.log("📝 New selection:", newSelection);

    setSelectedColumns(newSelection);
    validateSelection(newSelection);
  };

  // Update the validateSelection function
  const validateSelection = (selection) => {
    const errors = [];

    // Only validate if all required fields are filled
    const hasAllRequiredFields =
      selection.target &&
      selection.date &&
      selection.frequency &&
      selection.horizon;

    if (hasAllRequiredFields) {
      // Check for overlapping selections
      const allSelected = [
        selection.target,
        selection.date,
        ...(selection.grouping || []),
      ].filter(Boolean);

      const uniqueSelected = new Set(allSelected);
      if (allSelected.length !== uniqueSelected.size) {
        errors.push("The same column cannot be used for multiple purposes");
      }

      // Only validate date granularity if we have both date and frequency
      if (!dateGranularity) {
        errors.push(
          "Unable to determine date granularity. Please check date column values."
        );
      } else if (
        !VALID_AGGREGATIONS[dateGranularity]?.includes(selection.frequency)
      ) {
        errors.push(
          `Selected frequency (${selection.frequency}) is too granular for the date column. ` +
            `Minimum possible frequency is ${dateGranularity}.`
        );
      }

      // Validate horizon
      if (selection.horizon < 1) {
        errors.push("Forecast horizon must be at least 1 period");
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Update the handleNext function
  // Update the handleNext function
  const handleNext = () => {
    const allErrors = [];

    if (!selectedColumns.target) {
      allErrors.push("Target column is required for forecasting");
    }

    if (!selectedColumns.date) {
      allErrors.push("Date column is required for time series forecasting");
    }

    if (!selectedColumns.frequency) {
      allErrors.push("Forecast frequency is required");
    }

    if (!selectedColumns.horizon || selectedColumns.horizon < 1) {
      allErrors.push("Forecast horizon must be at least 1 period");
    }

    // Calculate aggregation impact with proper date handling
    if (selectedColumns.frequency && dateGranularity) {
      const uniqueDates = new Set();
      const failedDates = new Set();

      data.rawData.forEach((row) => {
        try {
          const date = parseFlexibleDate(row[selectedColumns.date]);
          if (!date) {
            console.warn("Could not parse date:", row[selectedColumns.date]);
            failedDates.add(row[selectedColumns.date]);
            return;
          }

          // For weekly aggregation, convert to week start date
          if (selectedColumns.frequency === "W") {
            const dayOfWeek = date.getDay();
            date.setDate(date.getDate() - dayOfWeek);
          }

          uniqueDates.add(formatDateForDisplay(date));
        } catch (error) {
          console.error("Error processing date:", error);
          failedDates.add(row[selectedColumns.date]);
        }
      });

      // Log failed dates for debugging
      if (failedDates.size > 0) {
        console.warn('Failed to parse dates:', Array.from(failedDates));
      }

      // Calculate impact
      const impact = {
        originalCount: data.rawData.length,
        aggregatedCount: uniqueDates.size,
        reductionPercent: (
          ((data.rawData.length - uniqueDates.size) / data.rawData.length) *
          100
        ).toFixed(1),
      };

      console.log("Aggregation impact:", impact);

      onUpdate({
        ...selectedColumns,
        aggregationImpact: impact,
      });
    }

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      return;
    }

    onNext();
  };

  const getSelectionSummary = () => {
    const selected = selectedColumns;
    return {
      target: selected.target || "Not selected",
      date: selected.date || "Not selected",
      grouping:
        (selected.grouping || []).length > 0
          ? `${selected.grouping.length} selected`
          : "None",
      frequency: selected.frequency || "Not selected",
      horizon: selected.horizon || "Not set",
    };
  };

  // Update the getAllColumnsWithRecommendations function and add debugging:
  const getAllColumnsWithRecommendations = (recommendedType) => {
    console.log(
      "🔍 getAllColumnsWithRecommendations called with:",
      recommendedType
    );
    console.log("📊 data.columns:", data.columns);
    console.log(
      "📋 data.validationResults?.columnAnalysis:",
      data.validationResults?.columnAnalysis
    );

    if (!data.columns) {
      console.log("❌ No data.columns found");
      return { recommended: [], others: [] };
    }

    const recommendedColumns = getColumnsByType(recommendedType);
    console.log(
      `✅ Recommended ${recommendedType} columns:`,
      recommendedColumns
    );

    const otherColumns = data.columns.filter(
      (col) => !recommendedColumns.includes(col)
    );
    console.log(`📋 Other columns:`, otherColumns);

    return {
      recommended: recommendedColumns,
      others: otherColumns,
    };
  };

  // Add these helper functions
  const detectDateGranularity = (dateValues) => {
    // Convert strings to Date objects
    const dates = dateValues
      .map((str) => new Date(str))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a - b);

    if (dates.length < 2) return null;

    // Calculate intervals between consecutive dates
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push({
        days: Math.round((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)),
        monthsDiff:
          (dates[i].getFullYear() - dates[i - 1].getFullYear()) * 12 +
          (dates[i].getMonth() - dates[i - 1].getMonth()),
        date1: dates[i - 1],
        date2: dates[i],
      });
    }

    // Check patterns starting from smallest to largest granularity
    const isDaily = intervals.every((i) => i.days === 1);
    if (isDaily) return "D";

    const isWeekly = intervals.every((i) => i.days >= 6 && i.days <= 8);
    if (isWeekly) return "W";

    const isMonthly = intervals.every((i) => {
      return (
        i.monthsDiff === 1 &&
        Math.abs(i.date1.getDate() - i.date2.getDate()) <= 3
      );
    });
    if (isMonthly) return "M";

    // If no clear pattern is found, use the most common interval
    const mostCommonInterval = getMostCommonInterval(intervals);
    return mostCommonInterval;
  };

  const getMostCommonInterval = (intervals) => {
    // Count frequency of each interval
    const frequencyMap = intervals.reduce((acc, interval) => {
      // For daily intervals
      if (interval.days === 1) {
        acc.D = (acc.D || 0) + 1;
      }
      // For weekly intervals (6-8 days)
      else if (interval.days >= 6 && interval.days <= 8) {
        acc.W = (acc.W || 0) + 1;
      }
      // For monthly intervals
      else if (interval.monthsDiff === 1) {
        acc.M = (acc.M || 0) + 1;
      }
      // For quarterly intervals
      else if (interval.monthsDiff === 3) {
        acc.Q = (acc.Q || 0) + 1;
      }
      // For yearly intervals
      else if (interval.monthsDiff === 12) {
        acc.Y = (acc.Y || 0) + 1;
      }
      return acc;
    }, {});

    // Find the most common interval
    const mostCommon = Object.entries(frequencyMap).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return mostCommon ? mostCommon[0] : "D"; // Default to daily if no pattern found
  };

  const isAggregationNeeded = () => {
    return (
      dateGranularity &&
      selectedColumns.frequency &&
      dateGranularity !== selectedColumns.frequency
    );
  };

  return (
    <Box>
      {/* Page Title - h5 for main page titles */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Step 2: Select Columns for Forecasting
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>
            Configure your forecasting model by selecting the appropriate
            columns.
          </strong>
          <br />
          Choose your target variable, date column, and relevant features for
          accurate predictions.
        </Typography>
      </Alert>

      {/* Selection Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <SettingsIcon color="primary" />
            {/* Card titles - h6 consistently */}
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Column Configuration
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}
              >
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`Target: ${getSelectionSummary().target}`}
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  icon={<CalendarTodayIcon />}
                  label={`Date: ${getSelectionSummary().date}`}
                  variant="outlined"
                  color="info"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}
              >
                <Chip
                  icon={<CategoryIcon />}
                  label={`Grouping: ${getSelectionSummary().grouping}`}
                  variant="outlined"
                  color="secondary"
                />
                <Chip
                  icon={<DataUsageIcon />}
                  label={`Total Columns: ${data.columns?.length || 0}`}
                  variant="outlined"
                  color="default"
                />
                <Chip
                  icon={<AutoGraphIcon />}
                  label={`Frequency: ${getSelectionSummary().frequency}`}
                  variant="outlined"
                  color="warning"
                />
                <Chip
                  icon={<TrendingUpIcon />}
                  label={`Horizon: ${getSelectionSummary().horizon} periods`}
                  variant="outlined"
                  color="success"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Column Selection Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Target Column Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <TrendingUpIcon color="primary" />
                {/* Section titles - h6 consistently */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Target Column
                </Typography>
                <Chip label="Required" size="small" color="error" />
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Target Column</InputLabel>
                <Select
                  value={selectedColumns.target}
                  onChange={(e) => handleColumnChange("target", e.target.value)}
                  label="Select Target Column"
                >
                  {/* Recommended Numeric Columns */}
                  {getColumnsByType("numeric").length > 0 && (
                    <MenuItem disabled key="numeric-header">
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: "success.main" }}
                      >
                        📊 RECOMMENDED (Numeric)
                      </Typography>
                    </MenuItem>
                  )}
                  {getColumnsByType("numeric").map((column) => (
                    <MenuItem key={column} value={column}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                        }}
                      >
                        <TrendingUpIcon fontSize="small" color="success" />
                        <Typography variant="body1">{column}</Typography>
                        <Chip
                          label={`${(
                            getColumnInfo(column).confidence * 100
                          ).toFixed(0)}%`}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                      </Box>
                    </MenuItem>
                  ))}

                  {/* Divider if there are recommended columns */}
                  {getColumnsByType("numeric").length > 0 && (
                    <MenuItem disabled key="divider-1">
                      <Divider sx={{ width: "100%" }} />
                    </MenuItem>
                  )}

                  {/* Other Columns */}
                  <MenuItem disabled key="other-header">
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      📋 OTHER COLUMNS
                    </Typography>
                  </MenuItem>
                  {data.columns
                    .filter((col) => !getColumnsByType("numeric").includes(col))
                    .map((column) => (
                      <MenuItem key={column} value={column}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                          }}
                        >
                          <InfoIcon fontSize="small" color="action" />
                          <Typography variant="body1">{column}</Typography>
                          <Chip
                            label={getColumnInfo(column).type || "Unknown"}
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Description text - body2 consistently */}
              <Typography variant="body2" color="textSecondary">
                The variable you want to predict. Numeric columns are
                recommended, but you can select any column.
              </Typography>

              {selectedColumns.target && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                  {/* Selected info - caption consistently */}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Selected: {selectedColumns.target}
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    Type:{" "}
                    {getColumnInfo(selectedColumns.target).type || "Unknown"} |
                    Confidence:{" "}
                    {getColumnInfo(selectedColumns.target).confidence
                      ? `${(
                          getColumnInfo(selectedColumns.target).confidence * 100
                        ).toFixed(0)}%`
                      : "N/A"}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Date Column Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <CalendarTodayIcon color="info" />
                {/* Section titles - h6 consistently */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Date Column
                </Typography>
                <Chip label="Required" size="small" color="error" />
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Date Column</InputLabel>
                <Select
                  value={selectedColumns.date}
                  onChange={(e) => handleColumnChange("date", e.target.value)}
                  label="Select Date Column"
                >
                  {/* Recommended Date Columns */}
                  {getColumnsByType("date").length > 0 && (
                    <MenuItem disabled key="date-header">
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: "info.main" }}
                      >
                        📅 RECOMMENDED (Date)
                      </Typography>
                    </MenuItem>
                  )}
                  {getColumnsByType("date").map((column) => (
                    <MenuItem key={column} value={column}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                        }}
                      >
                        <CalendarTodayIcon fontSize="small" color="info" />
                        <Typography variant="body1">{column}</Typography>
                        <Chip
                          label={`${(
                            getColumnInfo(column).confidence * 100
                          ).toFixed(0)}%`}
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      </Box>
                    </MenuItem>
                  ))}

                  {/* Divider if there are recommended columns */}
                  {getColumnsByType("date").length > 0 && (
                    <MenuItem disabled key="divider-2">
                      <Divider sx={{ width: "100%" }} />
                    </MenuItem>
                  )}

                  {/* Other Columns */}
                  <MenuItem disabled key="other-date-header">
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      📋 OTHER COLUMNS
                    </Typography>
                  </MenuItem>
                  {data.columns
                    .filter((col) => !getColumnsByType("date").includes(col))
                    .map((column) => (
                      <MenuItem key={column} value={column}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                          }}
                        >
                          <InfoIcon fontSize="small" color="action" />
                          <Typography variant="body1">{column}</Typography>
                          <Chip
                            label={getColumnInfo(column).type || "Unknown"}
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Description text - body2 consistently */}
              <Typography variant="body2" color="textSecondary">
                The time dimension for your forecast. Date columns are
                recommended, but you can select any column.
              </Typography>

              {selectedColumns.date && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                  {/* Selected info - caption consistently */}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Selected: {selectedColumns.date}
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    Type:{" "}
                    {getColumnInfo(selectedColumns.date).type || "Unknown"} |
                    Confidence:{" "}
                    {getColumnInfo(selectedColumns.date).confidence
                      ? `${(
                          getColumnInfo(selectedColumns.date).confidence * 100
                        ).toFixed(0)}%`
                      : "N/A"}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Grouping Column Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <CategoryIcon color="secondary" />
                {/* Section titles - h6 consistently */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Grouping Columns
                </Typography>
                <Chip label="Optional" size="small" color="success" />
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Grouping Columns</InputLabel>
                <Select
                  multiple
                  value={selectedColumns.grouping || []}
                  onChange={(e) =>
                    handleColumnChange("grouping", e.target.value)
                  }
                  label="Select Grouping Columns"
                  MenuProps={MenuProps}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {/* Recommended Categorical/Binary Columns */}
                  {[
                    ...getColumnsByType("categorical"),
                    ...getColumnsByType("binary"),
                  ].length > 0 && (
                    <MenuItem disabled key="grouping-header">
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: "secondary.main" }}
                      >
                        🏷️ RECOMMENDED (Categorical/Binary)
                      </Typography>
                    </MenuItem>
                  )}
                  {[
                    ...getColumnsByType("categorical"),
                    ...getColumnsByType("binary"),
                  ].map((column) => (
                    <MenuItem key={column} value={column}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                        }}
                      >
                        {getColumnTypeIcon(getColumnInfo(column).type)}
                        <Typography variant="body1">{column}</Typography>
                        <Chip
                          label={getColumnInfo(column).type}
                          size="small"
                          color={getColumnTypeColor(getColumnInfo(column).type)}
                        />
                        <Box sx={{ flexGrow: 1 }} />
                        {(selectedColumns.grouping || []).includes(column) && (
                          <CheckCircleIcon color="success" fontSize="small" />
                        )}
                      </Box>
                    </MenuItem>
                  ))}

                  {/* Divider if there are recommended columns */}
                  {[
                    ...getColumnsByType("categorical"),
                    ...getColumnsByType("binary"),
                  ].length > 0 && (
                    <MenuItem disabled key="divider-3">
                      <Divider sx={{ width: "100%" }} />
                    </MenuItem>
                  )}

                  {/* Other Columns */}
                  <MenuItem disabled key="other-grouping-header">
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      📋 OTHER COLUMNS
                    </Typography>
                  </MenuItem>
                  {data.columns
                    .filter(
                      (col) =>
                        ![
                          ...getColumnsByType("categorical"),
                          ...getColumnsByType("binary"),
                        ].includes(col)
                    )
                    .map((column) => (
                      <MenuItem key={column} value={column}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                          }}
                        >
                          <InfoIcon fontSize="small" color="action" />
                          <Typography variant="body1">{column}</Typography>
                          <Chip
                            label={getColumnInfo(column).type || "Unknown"}
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                          <Box sx={{ flexGrow: 1 }} />
                          {(selectedColumns.grouping || []).includes(
                            column
                          ) && (
                            <CheckCircleIcon color="success" fontSize="small" />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Description text - body2 consistently */}
              <Typography variant="body2" color="textSecondary">
                Group forecasts by categories. Categorical/binary columns are
                recommended, but you can select any column.
              </Typography>

              {selectedColumns.grouping &&
                selectedColumns.grouping.length > 0 && (
                  <Box
                    sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Selected Grouping Columns (
                      {selectedColumns.grouping.length}):
                    </Typography>
                    <Box
                      sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}
                    >
                      {selectedColumns.grouping.map((column) => (
                        <Chip
                          key={column}
                          label={`${column} (${
                            getColumnInfo(column).type || "Unknown"
                          })`}
                          size="small"
                          color="secondary"
                          variant="filled"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
            </CardContent>
          </Card>
        </Grid>

        {/* Forecast Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <AutoGraphIcon color="warning" />
                {/* Section titles - h6 consistently */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Forecast Frequency
                </Typography>
                <Chip label="Required" size="small" color="error" />
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Forecast Frequency</InputLabel>
                <Select
                  value={selectedColumns.frequency}
                  onChange={(e) =>
                    handleColumnChange("frequency", e.target.value)
                  }
                  label="Select Forecast Frequency"
                  disabled={!dateGranularity}
                >
                  {frequencyOptions
                    .filter(
                      (opt) =>
                        !dateGranularity ||
                        VALID_AGGREGATIONS[dateGranularity]?.includes(opt.value)
                    )
                    .map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            width: "100%",
                          }}
                        >
                          <AutoGraphIcon fontSize="small" color="warning" />
                          <Typography variant="body1">
                            {option.label}
                          </Typography>
                          <Chip
                            label={option.value}
                            size="small"
                            variant="outlined"
                            color="warning"
                          />
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Description text - body2 consistently */}
              <Typography variant="body2" color="textSecondary">
                How often do you want to generate forecasts? This should match
                your data&apos;s time intervals.
              </Typography>

              {selectedColumns.frequency && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                  {/* Selected info - caption consistently */}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Selected:{" "}
                    {
                      frequencyOptions.find(
                        (opt) => opt.value === selectedColumns.frequency
                      )?.label
                    }
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    Code: {selectedColumns.frequency}
                  </Typography>
                </Box>
              )}

              {/* Add information about detected granularity */}
              {dateGranularity && (
                <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2">
                    🔍 Detected date granularity:{" "}
                    <strong>
                      {
                        frequencyOptions.find(
                          (opt) => opt.value === dateGranularity
                        )?.label
                      }
                    </strong>
                    <br />
                    You can select this granularity or any higher level for
                    forecasting.
                  </Typography>
                </Alert>
              )}

              {/* Aggregation warning alert */}
              {isAggregationNeeded() && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    ⚠️ Data will be aggregated from{" "}
                    <strong>
                      {
                        frequencyOptions.find(
                          (opt) => opt.value === dateGranularity
                        )?.label
                      }
                    </strong>{" "}
                    to{" "}
                    <strong>
                      {
                        frequencyOptions.find(
                          (opt) => opt.value === selectedColumns.frequency
                        )?.label
                      }
                    </strong>{" "}
                    level.
                    <br />
                    Target values will be summed/averaged based on their type.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Forecast Horizon */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <TrendingUpIcon color="success" />
                {/* Section titles - h6 consistently */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Forecast Horizon
                </Typography>
                <Chip label="Required" size="small" color="error" />
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  type="number"
                  label="Number of Periods to Forecast"
                  value={selectedColumns.horizon || ""} // Add fallback to empty string
                  onChange={(e) =>
                    handleColumnChange(
                      "horizon",
                      e.target.value ? parseInt(e.target.value) : ""
                    )
                  }
                  inputProps={{ min: 1, max: 365 }}
                  fullWidth
                />
              </FormControl>

              {/* Description text - body2 consistently */}
              <Typography variant="body2" color="textSecondary">
                How many time periods ahead do you want to forecast? (e.g., 30
                days, 12 months)
              </Typography>

              {selectedColumns.horizon && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
                  {/* Selected info - caption consistently */}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Forecast Horizon: {selectedColumns.horizon} periods
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    {selectedColumns.frequency &&
                      `= ${selectedColumns.horizon} ${frequencyOptions
                        .find((opt) => opt.value === selectedColumns.frequency)
                        ?.label.toLowerCase()}`}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Please fix the following issues:
          </Typography>
          <List dense>
            {validationErrors.map((error, index) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <WarningIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={error}
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button onClick={onBack} size="large" sx={{ px: 4, py: 1.5 }}>
          <Typography variant="button">Back: Upload Data</Typography>
        </Button>

        <Button
          variant="contained"
          onClick={handleNext}
          disabled={validationErrors.length > 0}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
            boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
            "&:hover": {
              background: "linear-gradient(45deg, #1976D2 30%, #1BA8D9 90%)",
            },
          }}
        >
          <Typography variant="button">Next: Training Configuration</Typography>
        </Button>
      </Box>
    </Box>
  );
}
