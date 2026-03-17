// frontend/src/pages/CustomerEscalation/constants.js
// Application constants and configuration

import { 
  faHistory,
  faClipboardList,
  faUserTie,
  faReply,
  faEdit,
  faClock,
  faFile,
  faImage,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';

export const STANDARD_STATUSES = ['Open', 'Closed', 'Reopened'];

export const STATUS_TRANSITIONS = {
  'Open': [
    { value: 'Open', label: 'Open - Investigation ongoing (Current)', disabled: true },
    { value: 'Closed', label: 'Closed - Investigation concluded' }
  ],
  'Closed': [
    { value: 'Closed', label: 'Closed - Investigation concluded (Current)', disabled: true },
    { value: 'Reopened', label: 'Reopened - New evidence found' }
  ],
  'Reopened': [
    { value: 'Reopened', label: 'Reopened - New evidence found (Current)', disabled: true },
    { value: 'Closed', label: 'Closed - Investigation concluded' }
  ]
};

export const VALID_TRANSITIONS = {
  'Open': ['Closed'],
  'Closed': ['Reopened'],
  'Reopened': ['Closed']
};

export const TIMELINE_ICONS = {
  'initial_submission': faClipboardList,
  'technician_request': faUserTie,
  'customer_response': faReply,
  'technician_update': faEdit,
  'status_change': faHistory,
  'default': faClock
};

export const FAILURE_MODE_TYPES = [
  'CPU socket bent pins', 'CPU socket damage', 'Mismatch product label info', 
  'SSD failure', 'No display', 'Sensor failure',
  'Part misorientation', 'Rework failure', 'DIMM connector damage'
];