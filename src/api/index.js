import * as authServices from './authService';
import { adminApi as adminService } from './adminService';
import { documentsApi as documentService } from './documentService';
import { searchApi as searchService } from './searchService';
import { taskService } from './taskService';
import apiClient from './client';

// authService로 개별 함수들을 그룹화
const authService = {
  getUserInfo: authServices.getUserInfo,
  isAuthenticated: authServices.isAuthenticated,
  login: authServices.login,
  logout: authServices.logout,
  signup: authServices.signup
};

export {
  authService,
  adminService,
  documentService,
  searchService,
  taskService,
  apiClient
}; 