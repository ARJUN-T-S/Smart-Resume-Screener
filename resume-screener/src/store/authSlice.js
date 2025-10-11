import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  idToken: localStorage.getItem('idToken') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('idToken'),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setIdToken: (state, action) => {
      state.idToken = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('idToken', action.payload);
    },
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    clearIdToken: (state) => {
      state.idToken = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('idToken');
      localStorage.removeItem('user');
    },
  },
});

export const { setIdToken, setUser, clearIdToken } = authSlice.actions;
export default authSlice.reducer;