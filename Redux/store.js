import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './features/themeSlice'; 
import authReducer from './features/authSlice';
import profileReducer from './features/profileSlice'; 

export const store = configureStore({
  reducer: {
    theme: themeReducer, 
    auth: authReducer,
    profile: profileReducer, 
  },
});