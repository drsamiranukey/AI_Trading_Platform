import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper
} from '@mui/material';
import {
  Home,
  ArrowBack,
  SearchOff
} from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            maxWidth: 500,
            width: '100%'
          }}
        >
          {/* 404 Icon */}
          <Box sx={{ mb: 3 }}>
            <SearchOff
              sx={{
                fontSize: 80,
                color: 'text.secondary',
                mb: 2
              }}
            />
          </Box>

          {/* 404 Text */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '4rem', md: '6rem' },
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2
            }}
          >
            404
          </Typography>

          <Typography
            variant="h4"
            component="h2"
            gutterBottom
            sx={{ mb: 2 }}
          >
            Page Not Found
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Sorry, the page you are looking for doesn't exist or has been moved.
            Please check the URL or navigate back to a safe place.
          </Typography>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Button
              variant="contained"
              startIcon={<Home />}
              onClick={handleGoHome}
              sx={{ px: 3, py: 1.5 }}
            >
              Go Home
            </Button>

            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              sx={{ px: 3, py: 1.5 }}
            >
              Go Back
            </Button>
          </Box>

          {/* Additional Help */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Need help? Contact our support team at{' '}
              <Typography
                component="a"
                href="mailto:support@aitradingplatform.com"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                support@aitradingplatform.com
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;