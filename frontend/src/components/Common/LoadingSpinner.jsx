import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop
} from '@mui/material';

const LoadingSpinner = ({
  size = 40,
  message = 'Loading...',
  fullScreen = false,
  color = 'primary',
  sx = {}
}) => {
  const LoadingContent = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...sx
      }}
    >
      <CircularProgress
        size={size}
        color={color}
        thickness={4}
      />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}
        open={true}
      >
        <LoadingContent />
      </Backdrop>
    );
  }

  return <LoadingContent />;
};

// Specialized loading components
export const PageLoader = ({ message = 'Loading page...' }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      width: '100%'
    }}
  >
    <LoadingSpinner size={50} message={message} />
  </Box>
);

export const InlineLoader = ({ size = 20, message }) => (
  <LoadingSpinner
    size={size}
    message={message}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 1,
      flexDirection: 'row'
    }}
  />
);

export const FullScreenLoader = ({ message = 'Processing...' }) => (
  <LoadingSpinner
    size={60}
    message={message}
    fullScreen={true}
  />
);

export default LoadingSpinner;