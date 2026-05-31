import { createSlice } from '@reduxjs/toolkit';

const themeSlice = createSlice({
  name: 'theme', // This name is for internal Redux actions
  initialState: {
    isDarkMode: false,
  },
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer; // Ensure this line exists!