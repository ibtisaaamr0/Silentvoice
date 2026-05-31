import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// --- SIGNUP THUNK ---
export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async ({ email, password, name, profilePicture }, thunkAPI) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Update Auth Profile
      await user.updateProfile({
        displayName: name,
      });

      // Save to Firestore
      const userData = {
        uid: user.uid,
        name: name,
        email: email,
        profilePicture: profilePicture || null,
        createdAt: new Date().toISOString(),
      };

      await firestore()
        .collection('users')
        .doc(user.uid)
        .set(userData);

      return userData;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

// --- LOGIN THUNK ---
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, thunkAPI) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      const docSnap = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();

      if (docSnap.exists) {
        return docSnap.data();
      } else {
        return {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          profilePicture: null,
        };
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, isLoading: false, error: null },
  reducers: {
    logout: (state) => {
      auth().signOut();
      state.user = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;