// components/ForecastWizard/TrainingConfiguration.js
'use client';
import { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import { 
  Speed, 
  Assessment, 
  HighQuality // Replace Precision with HighQuality
} from '@mui/icons-material';

const trainingTypes = [
  {
    value: 'quick',
    label: 'Quick Training',
    icon: <Speed />,
    description: 'Fast training with basic models',
    duration: '2-5 minutes',
    accuracy: 'Basic',
    color: 'success'
  },
  {
    value: 'standard',
    label: 'Standard Training',
    icon: <Assessment />,
    description: 'Balanced training with good accuracy',
    duration: '10-20 minutes',
    accuracy: 'Good',
    color: 'primary'
  },
  {
    value: 'thorough',
    label: 'Thorough Training',
    icon: <HighQuality />, // Use HighQuality instead of Precision
    description: 'Comprehensive training for best results',
    duration: '30-60 minutes',
    accuracy: 'Best',
    color: 'warning'
  }
];

export default function TrainingConfiguration({ data, onUpdate, onNext, onBack, setError }) {
  const [selectedType, setSelectedType] = useState(data.trainingConfig?.type || 'standard');

  const handleTypeChange = (event) => {
    const type = event.target.value;
    setSelectedType(type);
    
    const trainingConfig = {
      type,
      parameters: getParametersForType(type)
    };
    
    onUpdate({ trainingConfig });
  };

  const getParametersForType = (type) => {
    switch (type) {
      case 'quick':
        return {
          models: ['linear', 'seasonal_naive'],
          cross_validation: false,
          hyperparameter_tuning: false,
          ensemble: false
        };
      case 'standard':
        return {
          models: ['linear', 'seasonal_naive', 'arima', 'ets'],
          cross_validation: true,
          hyperparameter_tuning: false,
          ensemble: true
        };
      case 'thorough':
        return {
          models: ['linear', 'seasonal_naive', 'arima', 'ets', 'neural_network'],
          cross_validation: true,
          hyperparameter_tuning: true,
          ensemble: true
        };
      default:
        return {};
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Step 5: Training Configuration
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Choose the training type that best fits your needs:
      </Typography>

      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <RadioGroup
          value={selectedType}
          onChange={handleTypeChange}
          name="training-type"
        >
          <Grid container spacing={2}>
            {trainingTypes.map((type) => (
              <Grid item xs={12} md={4} key={type.value}>
                <Card 
                  sx={{ 
                    height: '100%',
                    border: selectedType === type.value ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      transition: 'border-color 0.2s ease'
                    }
                  }}
                >
                  <CardContent>
                    <FormControlLabel
                      value={type.value}
                      control={<Radio />}
                      label={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {type.icon}
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {type.label}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {type.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={`Duration: ${type.duration}`} 
                              size="small"
                              color={type.color}
                            />
                            <Chip 
                              label={`Accuracy: ${type.accuracy}`} 
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                      sx={{ 
                        alignItems: 'flex-start',
                        '& .MuiFormControlLabel-label': { width: '100%' }
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </RadioGroup>
      </FormControl>

      {selectedType && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Selected: {trainingTypes.find(t => t.value === selectedType)?.label}</strong>
            <br />
            This will train the model using the {selectedType} configuration with appropriate algorithms and validation methods.
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button variant="contained" onClick={onNext}>
          Next: Start Training
        </Button>
      </Box>
    </Box>
  );
}