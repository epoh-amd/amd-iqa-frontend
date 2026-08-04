import React from 'react';

const EscapeTracker = () => {
  return (
    <iframe
      src="/escape-tracker.html"
      title="Escape Tracker"
      style={{
        width: '100%',
        height: 'calc(100vh - 60px)',
        border: 'none',
        display: 'block'
      }}
    />
  );
};

export default EscapeTracker;
