import { createSlice } from '@reduxjs/toolkit';

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    bio: "Communication is key.",
    profilePicture: null, // Holds the URI for the optional photo
    preferences: {
      notifications: true,
      fontSize: 14,
    },
  },
  reducers: {
    updateBio: (state, action) => {
      state.bio = action.payload;
    },
    // New action to update the picture URI
    setProfilePicture: (state, action) => {
      state.profilePicture = action.payload;
    },
    // Bulk update for when you log in or sync from Firestore
    setProfileData: (state, action) => {
      state.bio = action.payload.bio || state.bio;
      state.profilePicture = action.payload.profilePicture || state.profilePicture;
      if (action.payload.preferences) {
        state.preferences = { ...state.preferences, ...action.payload.preferences };
      }
    },
    toggleNotifications: (state) => {
      state.preferences.notifications = !state.preferences.notifications;
    },
    // Clear everything on logout
    resetProfile: (state) => {
      state.bio = "Communication is key.";
      state.profilePicture = null;
      state.preferences = { notifications: true, fontSize: 14 };
    }
  },
});

export const { 
  updateBio, 
  setProfilePicture, 
  setProfileData, 
  toggleNotifications, 
  resetProfile 
} = profileSlice.actions;

export default profileSlice.reducer;