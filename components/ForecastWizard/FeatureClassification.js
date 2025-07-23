// components/ForecastWizard/FeatureClassification.js
"use client";
import React, { useState, useEffect } from "react";
import { parseISO } from "date-fns/parseISO";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";

import {
  Box,
  Typography,
  Grid,
  Button,
  Alert,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import DownloadIcon from "@mui/icons-material/Download";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  getFirstForecastDate,
  generateDateSequence,
} from "../../utils/dateUtils";
import { uploadFileToS3, generateFilePath } from "../../utils/s3Storage";

const parseFlexibleDate = (dateStr) => {
  // Common date formats to try
  const formats = [
    "M/d/yyyy", // 1/13/2011
    "d/M/yyyy", // 13/1/2011
    "MM/dd/yyyy", // 01/13/2011
    "dd/MM/yyyy", // 13/01/2011
    "yyyy-MM-dd", // 2011-01-13
    "yyyy/MM/dd", // 2011/01/13
    "dd-MM-yyyy", // 13-01-2011
    "MM-dd-yyyy", // 01-13-2011
  ];

  // Try each format until one works
  for (const fmt of formats) {
    try {
      const parsedDate = parse(dateStr, fmt, new Date());
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    } catch (e) {
      continue;
    }
  }
  throw new Error(`Unable to parse date: ${dateStr}`);
};

export default function FeatureClassification({
  data,
  onUpdate,
  onNext,
  onBack,
  setError,
}) {
  const [futureValues, setFutureValues] = useState({});
  const [futureValuesFile, setFutureValuesFile] = useState(null);

  // Add state for upload tracking
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Get eligible columns (excluding target, date, and grouping columns)
  const getEligibleColumns = () => {
    if (!data?.columns || !data?.selectedColumns) return [];

    const excludedColumns = [
      data.selectedColumns.target,
      data.selectedColumns.date,
      ...(data.selectedColumns.grouping || []),
    ];

    return data.columns.filter((column) => !excludedColumns.includes(column));
  };

  // Get column's data type (from auto or user classification)
  const getEffectiveDataType = (column) => {
    if (!data || !column) return null;

    // First check user classifications
    if (data.dataClassification?.userClassified?.[column]) {
      return data.dataClassification.userClassified[column];
    }

    // Then check auto classifications
    if (data.dataClassification?.autoClassified?.[column]) {
      return data.dataClassification.autoClassified[column];
    }

    return null;
  };

  // Handle future value toggle
  const handleFutureValueChange = (column, canProvide) => {
    const newFutureValues = { ...futureValues, [column]: canProvide };
    setFutureValues(newFutureValues);

    onUpdate({
      futureValues: newFutureValues,
      selectedFutureFeatures: Object.keys(newFutureValues).filter(
        (col) => newFutureValues[col]
      ),
    });
  };

  // Generate template for future values
  const generateFutureValuesTemplate = () => {
    const selectedColumns = Object.keys(futureValues).filter(
      (col) => futureValues[col]
    );

    if (selectedColumns.length === 0) {
      setError("Please select at least one column for future values");
      return;
    }

    // Get the maximum date from the data
    const dateColumn = data.selectedColumns?.date;
    if (!dateColumn || !data.rawData?.length) {
      setError("No date data available");
      return;
    }

    // Add debug logging
    console.log("Date parsing debug:", {
      dateColumn,
      sampleDates: data.rawData.slice(0, 3).map((row) => row[dateColumn]),
    });

    // Convert dates and find max date - Updated parsing logic
    let maxDate;
    try {
      const dates = data.rawData
        .map((row) => row[dateColumn])
        .filter(Boolean)
        .map((dateStr) => {
          try {
            return parseFlexibleDate(dateStr);
          } catch (parseError) {
            throw new Error(
              `Invalid date format: ${dateStr}. Please ensure dates are in a standard format (e.g., MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)`
            );
          }
        });

      if (dates.length === 0) {
        throw new Error("No valid dates found in data");
      }

      maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

      console.log("Date processing results:", {
        maxDate,
        formattedMaxDate: format(maxDate, "yyyy-MM-dd"),
      });
    } catch (error) {
      console.error("Date processing error:", error);
      setError(`Error processing dates: ${error.message}`);
      return;
    }

    // Get frequency and horizon from user selections
    const frequency = data.selectedColumns?.frequency;
    const horizon = parseInt(data.selectedColumns?.horizon);

    if (!frequency || !horizon) {
      setError("Forecast frequency and horizon must be set");
      return;
    }

    try {
      // Generate future dates
      const firstForecastDate = getFirstForecastDate(maxDate, frequency);
      const futureDates = generateDateSequence(
        firstForecastDate,
        frequency,
        horizon
      );

      // Create CSV content
      const headers = ["timestamp", ...selectedColumns];
      const rows = futureDates.map((date) => {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
          throw new Error("Invalid date generated");
        }

        const row = [format(date, "yyyy-MM-dd")];
        // Add placeholder for each selected column
        selectedColumns.forEach((col) => {
          const dataType = getEffectiveDataType(col);
          // Add appropriate placeholder based on data type
          if (dataType === "numeric") {
            row.push("0");
          } else if (dataType === "categorical" || dataType === "binary") {
            row.push("value");
          }
        });
        return row;
      });

      // Update the CSV content generation part
      // Update the template generation part in generateFutureValuesTemplate
      const csvContent = [
        "# =================================================================",
        "# Future Values Template",
        "# Generated for forecast horizon: " + horizon + " " + frequency,
        "# Start date: " + format(firstForecastDate, "yyyy-MM-dd"),
        "# Max data date: " + format(maxDate, "yyyy-MM-dd"),
        "# Note: All dates should be in YYYY-MM-DD format",
        "# Note: Comment rows starting with # are optional and can be kept or removed",
        "# =================================================================",
        headers.join(","),
        ...rows.map((row) => {
          row[0] = format(new Date(row[0]), "yyyy-MM-dd");
          return row.join(",");
        }),
      ].join("\n");

      // Download the template
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `future_values_template_${format(
        new Date(),
        "yyyyMMdd"
      )}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating template:", error);
      setError("Error generating template: " + error.message);
    }
  };

  // Update handleFileUpload function
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Parse and validate file content first
      const text = await file.text();
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));

      if (lines.length === 0) {
        throw new Error("File is empty or contains only comments");
      }

      // Validate headers and data
      const headers = lines[0].split(",").map((h) => h.trim());
      const timestampIndex = headers.indexOf("timestamp");

      if (timestampIndex === -1) {
        throw new Error("Template must have a timestamp column");
      }

      // Parse and validate data rows
      const dataRows = lines.slice(1);
      if (dataRows.length === 0) {
        throw new Error("No data rows found in file");
      }

      // Process the rows with date validation
      const rows = dataRows.map((line, index) => {
        const values = line.split(",").map((v) => v.trim());
        try {
          const date = parseFlexibleDate(values[timestampIndex]);
          values[timestampIndex] = format(date, "yyyy-MM-dd");
          return values;
        } catch (error) {
          throw new Error(
            `Invalid date in row ${index + 2}: ${values[timestampIndex]}`
          );
        }
      });

      // Create the validated content with metadata
      const csvContent = [
        "# Future Values Data",
        `# Upload Date: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`,
        `# Total Rows: ${rows.length}`,
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Create FormData with processed file
      const formData = new FormData();
      const processedFile = new File(
        [csvContent],
        `future_values_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`,
        { type: "text/csv" }
      );
      formData.append("file", processedFile);

      // Add metadata to indicate this is a future values file
      formData.append("fileType", "future_values");
      formData.append("uploadPath", "outputs/future_values");

      // Use the same API endpoint with custom path
      const response = await fetch("/api/wizard/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      setUploadProgress(100);

      if (!result.success || !result.s3Info) {
        throw new Error("Invalid response from server");
      }

      // Update state with upload results
      onUpdate({
        futureValuesData: {
          headers,
          rows,
          s3Location: result.s3Info.url,
          fileName: processedFile.name,
        },
      });

      console.log("Successfully uploaded future values:", {
        fileName: processedFile.name,
        s3Location: result.s3Info.url,
      });

      setError(null);
    } catch (error) {
      console.error("Error processing file:", error);
      setError(`Error processing file: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Future Values Configuration
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Select which columns will have known future values at prediction time.
          Only numeric, categorical, and binary columns can be selected. Target,
          date, and grouping columns are automatically excluded.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {getEligibleColumns().map((column) => {
          const dataType = getEffectiveDataType(column);
          const isEligible = ["numeric", "categorical", "binary"].includes(
            dataType
          );

          return (
            <Grid item xs={12} md={6} key={column}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {column}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Type: {dataType || "Unknown"}
                    </Typography>
                  </Box>

                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={futureValues[column] || false}
                        onChange={(e) =>
                          handleFutureValueChange(column, e.target.checked)
                        }
                        disabled={!isEligible}
                      />
                    }
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Typography variant="body2">
                          Future Values Available
                        </Typography>
                        <Tooltip
                          title={
                            isEligible
                              ? "Check if you'll have future values for this column during prediction"
                              : "Only numeric, categorical, and binary columns can have future values"
                          }
                        >
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Template download/upload section */}
      {Object.values(futureValues).some((v) => v) && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Future Values Template
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={generateFutureValuesTemplate}
              >
                Download Template
              </Button>
              <Button
                variant="contained"
                component="label"
                startIcon={
                  uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />
                }
                disabled={uploading}
              >
                {uploading
                  ? `Uploading... ${uploadProgress}%`
                  : "Upload Future Values"}
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={onNext}>
          Next
        </Button>
      </Box>
    </Box>
  );
}
