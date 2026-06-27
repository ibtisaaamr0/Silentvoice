import {createSlice} from '@reduxjs/toolkit';

const avatarSlice = createSlice({
  name: 'avatar',
  initialState: {
    selectedId: 'classic',
  },
  reducers: {
    setSelectedAvatar: (state, action) => {
      state.selectedId = action.payload;
    },
  },
});

export const {setSelectedAvatar} = avatarSlice.actions;
export default avatarSlice.reducer;
