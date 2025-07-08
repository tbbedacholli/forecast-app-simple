// components/FirstTimeTour.js
'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Fade,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Menu as MenuIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const tourSteps = [
  {
    title: "Welcome to ForecastPro! 🎉",
    content: "Let's take a quick tour to help you get started with the key features.",
    icon: <CheckIcon sx={{ color: '#10b981' }} />,
    target: null
  },
  {
    title: "Sidebar Navigation", 
    content: "Click the menu icon in the top-left to expand or collapse the sidebar. This gives you quick access to all sections while maximizing your workspace.",
    icon: <MenuIcon sx={{ color: '#3b82f6' }} />,
    target: "sidebar-toggle"
  },
  {
    title: "Theme Toggle",
    content: "Switch between light and dark modes using the theme toggle in the top-right. Your preference will be saved automatically.", 
    icon: <LightModeIcon sx={{ color: '#f59e0b' }} />,
    target: "theme-toggle"
  }
];

export default function FirstTimeTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      // Delay showing the tour slightly for better UX
      setTimeout(() => {
        setIsOpen(true);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (isOpen && tourSteps[activeStep]?.target) {
      setShowHighlight(true);
      // Add highlight effect to target element
      const targetElement = document.querySelector(`[data-tour="${tourSteps[activeStep].target}"]`);
      if (targetElement) {
        targetElement.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.3)';
        targetElement.style.borderRadius = '8px';
        targetElement.style.transition = 'all 0.3s ease';
      }
    }

    return () => {
      // Cleanup highlights
      document.querySelectorAll('[data-tour]').forEach(el => {
        el.style.boxShadow = '';
        el.style.borderRadius = '';
      });
    };
  }, [activeStep, isOpen]);

  const handleNext = () => {
    if (activeStep < tourSteps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleFinish = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setIsOpen(false);
    setShowHighlight(false);
    // Cleanup any remaining highlights
    document.querySelectorAll('[data-tour]').forEach(el => {
      el.style.boxShadow = '';
      el.style.borderRadius = '';
    });
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setIsOpen(false);
    setShowHighlight(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog
        open={isOpen}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ position: 'relative' }}>
            {/* Close button */}
            <IconButton
              onClick={handleSkip}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                zIndex: 1,
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Tour content */}
            <Box sx={{ p: 4 }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {tourSteps.map((step, index) => (
                  <Step key={index}>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: index <= activeStep ? 'primary.main' : 'action.disabled',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          transition: 'all 0.3s ease'
                        }}>
                          {step.icon}
                        </Box>
                      )}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {step.title}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ pb: 2 }}>
                        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                          {step.content}
                        </Typography>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
          <Button
            onClick={handleSkip}
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Skip Tour
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<BackIcon />}
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={activeStep === tourSteps.length - 1 ? <CheckIcon /> : <NextIcon />}
              sx={{ textTransform: 'none' }}
            >
              {activeStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}