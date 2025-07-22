"use client";
import { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Alert,
  LinearProgress,
} from "@mui/material";

// Import all your step components
import FileUpload from "./FileUpload";
import ColumnSelection from "./ColumnSelection";
import DataClassification from "./DataClassification";
import FeatureClassification from "./FeatureClassification";
import TrainingConfiguration from "./TrainingConfiguration";

export default function ForecastWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    columns: [],
    rawData: [],
    validation: null,
    selectedColumns: {},
    featureClassification: {},
    futureValues: {},
    processedData: null,
    fileName: "",
    isProcessed: false,
    dataClassification: {
      autoClassified: {}, // Add this for storing auto-classified columns
      userClassified: {}, // Add this for storing user modifications
    },
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = [
    "Upload Data",
    "Data Classification",
    "Configure Parameters",
    "Feature Classification",
    "Training Configuration",
  ];

  const handleNext = () => {
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleDataUpdate = (newData) => {
    console.log("📊 Wizard data updated:", newData);
    setWizardData(newData);
  };

  const renderStep = () => {
    const commonProps = {
      data: wizardData,
      onUpdate: handleDataUpdate,
      onNext: handleNext,
      onBack: handleBack,
      setError,
      setLoading,
    };

    console.log("Before rendering ColumnSelection, wizardData:", wizardData); // Add this line

    switch (currentStep) {
      case 0:
        return <FileUpload {...commonProps} />;
      case 1:
        return <DataClassification {...commonProps} />;
      case 2:
        return <ColumnSelection {...commonProps} />;
      case 3:
        return <FeatureClassification {...commonProps} />;
      case 4:
        return <TrainingConfiguration {...commonProps} />;
      default:
        return (
          <Box p={3}>
            <Alert severity="error">
              Step {currentStep} not found. Please restart the wizard.
            </Alert>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <h1>🔮 Forecast Wizard</h1>
        <p>Build and configure your forecasting model step by step</p>
      </Box>

      {/* Progress Stepper */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={currentStep} sx={{ mb: 2 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel
                optional={
                  index === currentStep && loading ? (
                    <LinearProgress sx={{ mt: 1, width: "100%" }} />
                  ) : null
                }
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
          </Box>
        )}
      </Paper>

      {/* Step Content */}
      <Paper elevation={1} sx={{ minHeight: 500 }}>
        {renderStep()}
      </Paper>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === "development" && (
        <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <details>
            <summary>🔍 Debug Info (Development Only)</summary>
            <pre style={{ fontSize: "12px", overflow: "auto" }}>
              {JSON.stringify(
                {
                  currentStep,
                  dataKeys: Object.keys(wizardData),
                  hasRawData: !!wizardData.rawData?.length,
                  hasValidation: !!wizardData.validation,
                  selectedColumns: wizardData.selectedColumns,
                  featureClassCount: Object.keys(
                    wizardData.featureClassification || {}
                  ).length,
                  futureValuesCount: Object.keys(wizardData.futureValues || {})
                    .length,
                  isProcessed: wizardData.isProcessed,
                },
                null,
                2
              )}
            </pre>
          </details>
        </Box>
      )}
    </Box>
  );
}
