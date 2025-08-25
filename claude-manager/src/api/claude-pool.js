import { poolApi } from './apiClient';

export const claudePoolApi = {
  getAccountList: () => {
    return poolApi.post('/api/admin/list', {});
  },
  addAccount: (email, sessionKey) => {
    return poolApi.post('/api/admin/add', { email, session_key: sessionKey });
  },
  deleteAccount: (email) => {
    return poolApi.post('/api/admin/delete', { email });
  },
  updateAccount: (originalEmail, newEmail, sessionKey) => {
    return poolApi.post('/api/admin/update', {
      original_email: originalEmail,
      new_email: newEmail,
      session_key: sessionKey,
    });
  },
  adminSpecificLogin: (email, uniqueName) => {
    return poolApi.post('/api/admin/specific_login', { email, unique_name: uniqueName });
  },
  getAllAccountsStatus: () => {
    return poolApi.get('/api/admin/status');
  },
};


