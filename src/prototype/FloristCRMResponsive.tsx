import React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import FloristCRM from './FloristCRM';
import MobileFloristCRM from './MobileFloristCRM';

/**
 * Responsive wrapper that automatically switches between
 * desktop and mobile versions based on screen size
 */
const FloristCRMResponsive = () => {
  // Check if screen width is less than 768px (mobile)
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Render mobile version for small screens
  if (isMobile) {
    return <MobileFloristCRM />;
  }
  
  // Render desktop version for larger screens
  return <FloristCRM />;
};

export default FloristCRMResponsive;