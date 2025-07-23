// components/ForecastWizard/index.js
"use client";
import { useState } from "react";

// Material-UI Components
import {
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert,
} from "@mui/material";

// Wizard Step Components
import FileUpload from "./FileUpload";
import DataClassification from "./DataClassification";
import ColumnSelection from "./ColumnSelection";
import AggregationConfig from "./AggregationConfig";
import FeatureClassification from "./FeatureClassification";
import TrainingConfiguration from "./TrainingConfiguration";
import ModelTraining from "./ModelTraining";
import ValidationStep from "./ValidationStep";

// Wizard Steps Configuration
const steps = [
  "Upload Data",
  "Data Classification",
  "Select Columns",
  "Data Validation",      // Moved here
  "Configure Aggregation",
  "Feature Classification",
  "Training Configuration",
  "Model Training"
];

// Initial wizard state
const initialWizardState = {
  file: null,
  previewData: null,
  columns: [],
  rawData: null,
  totalRows: 0,
  totalColumns: 0,
  selectedColumns: {
    target: "",
    date: "",
    level: [],
    frequency: "",
    horizon: "",
  },
  validationResults: null,
  dataClassification: {
    autoClassified: {},    // Original automatic classifications
    userClassified: {},    // User's manual changes to classifications
  },
  featureClassification: {
    entityProperties: [],
    dynamicFeatures: [],
    selectedFutureFeatures: [],
  },
  trainingConfig: {
    type: "standard",
    parameters: {},
  },
  aggregatedData: null,
  futureTemplate: null,
  aggregationRules: {},
};

export default function ForecastWizard() {
  // State Management
  const [activeStep, setActiveStep] = useState(0);
  const [wizardData, setWizardData] = useState(initialWizardState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Navigation Handlers
  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleReset = () => {
    setActiveStep(0);
    setWizardData(initialWizardState);
    setError("");
  };

  // Data Update Handler
  const updateWizardData = (newData) => {
    console.log("📝 Updating wizard data with:", newData);
    setWizardData((prev) => {
      const updatedData = { ...prev, ...newData };
      console.log("📝 New wizard data state:", updatedData);
      return updatedData;
    });
  };

  // Step content renderer
  const getStepContent = (step) => {
    const commonProps = {
      data: wizardData,
      onUpdate: updateWizardData,
      onNext: handleNext,
      onBack: handleBack,
      setError,
    };

    switch (step) {
      case 0:
        return <FileUpload {...commonProps} />;
      case 1:
        return <DataClassification {...commonProps} />;
      case 2:
        return <ColumnSelection {...commonProps} />;
      case 3:
        return <ValidationStep {...commonProps} />; // Moved here
      case 4:
        return <AggregationConfig {...commonProps} />;
      case 5:
        return <FeatureClassification {...commonProps} />;
      case 6:
        return <TrainingConfiguration {...commonProps} />;
      case 7:
        return (
          <ModelTraining
            {...commonProps}
            onReset={handleReset}
            setLoading={setLoading}
          />
        );
      default:
        return "Unknown step";
    }
  };

  // Render
  return (
    <Box sx={{ width: "100%", maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        🧙‍♂️ Forecast Wizard
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>{getStepContent(activeStep)}</CardContent>
      </Card>
    </Box>
  );
}
