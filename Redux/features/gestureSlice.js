import { createSlice } from '@reduxjs/toolkit';

const gestureSlice = createSlice({
  name: 'gesture',
  initialState: {
    currentGesture: "Connecting...",
    status: 'idle', // 'idle' | 'loading' | 'connected' | 'error'
  },
  reducers: {
    setGesture: (state, action) => {
      state.currentGesture = action.payload;
      state.status = 'connected';
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setGestureError: (state, action) => {
      state.currentGesture = action.payload;
      state.status = 'error';
    }
  },
});

export const { setGesture, setStatus, setGestureError } = gestureSlice.actions;
export default gestureSlice.reducer;