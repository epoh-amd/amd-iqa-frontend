import api from '../../services/api';

export const DEFAULTS = {
  notifiers: [],
  approvers: [],
  subcontractors: ['Sanmina', 'Flex', 'Pegatron', 'Lenovo', 'Compal'],
  assemblyLevels: ['Board', 'Sub-Assembly', 'System'],
  materialActions: ['Material Substitution', 'Use-as-is', 'Rework', 'Remove', 'Scrap'],
};

export const getAllConfig = async () => {
  try {
    const data = await api.getWaiverConfig();
    return { ...DEFAULTS, ...data };
  } catch (e) {
    return { ...DEFAULTS };
  }
};

export const saveConfig = async (key, value) => {
  await api.saveWaiverConfig(key, value);
};
