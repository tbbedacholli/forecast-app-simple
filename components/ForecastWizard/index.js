// components/ForecastWizard/index.js
'use client';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert
} from '@mui/material';
import FileUpload from './FileUpload';
import ColumnSelection from './ColumnSelection';
import DataClassification from './DataClassification';
import FeatureClassification from './FeatureClassification';
import TrainingConfiguration from './TrainingConfiguration';
import ModelTraining from './ModelTraining';

const steps = [
  'Upload Data',
  'Select Columns',
  'Data Classification',
  'Feature Classification',
  'Training Configuration',
  'Model Training'
];

export default function ForecastWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    file: null,
    previewData: null,
    columns: [],
    selectedColumns: {
      target: '',
      date: '',
      level: [], // ← Ensure this is initialized as an empty array
      frequency: 'D',
      horizon: 30
    },
    dataClassification: {},
    featureClassification: {
      entityProperties: [],
      dynamicFeatures: [],
      selectedFutureFeatures: []
    },
    trainingConfig: {
      type: 'standard',
      parameters: {}
    },
    aggregatedData: null,
    futureTemplate: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setWizardData({
      file: null,
      previewData: null,
      columns: [],
      selectedColumns: {
        target: '',
        date: '',
        level: [], // Changed this to array
        frequency: 'D',
        horizon: 30
      },
      dataClassification: {},
      featureClassification: {
        entityProperties: [],
        dynamicFeatures: [],
        selectedFutureFeatures: []
      },
      trainingConfig: {
        type: 'standard',
        parameters: {}
      },
      aggregatedData: null,
      futureTemplate: null
    });
    setError('');
  };

  const updateWizardData = (newData) => {
    setWizardData(prev => ({ ...prev, ...newData }));
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <FileUpload 
            data={wizardData} 
            onUpdate={updateWizardData}
            onNext={handleNext}
            setError={setError}
            setLoading={setLoading}
          />
        );
      case 1:
        return (
          <ColumnSelection 
            data={wizardData} 
            onUpdate={updateWizardData}
            onNext={handleNext}
            onBack={handleBack}
            setError={setError}
          />
        );
      case 2:
        return (
          <DataClassification 
            data={wizardData} 
            onUpdate={updateWizardData}
            onNext={handleNext}
            onBack={handleBack}
            setError={setError}
          />
        );
      case 3:
        return (
          <FeatureClassification 
            data={wizardData} 
            onUpdate={updateWizardData}
            onNext={handleNext}
            onBack={handleBack}
            setError={setError}
          />
        );
      case 4:
        return (
          <TrainingConfiguration 
            data={wizardData} 
            onUpdate={updateWizardData}
            onNext={handleNext}
            onBack={handleBack}
            setError={setError}
          />
        );
      case 5:
        return (
          <ModelTraining 
            data={wizardData} 
            onUpdate={updateWizardData}
            onReset={handleReset}
            setError={setError}
            setLoading={setLoading}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
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
        <CardContent>
          {getStepContent(activeStep)}
        </CardContent>
      </Card>
    </Box>
  );
}