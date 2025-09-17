import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isAdmin: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isAdmin = action.payload.isAdmin === true;
      state.loading = false;
    },
    loginFailure(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload };
    },
    verifyAdmin(state, action){
      state.isAdmin = action.payload;
    }
  }
});

export const selectCurrentToken = (state) => state.auth.user?.token;
export const selectIsAdmin = (state) => state.auth.isAdmin;
export const selectUser = (state) => state.auth.user;

export const selectHasAdminPermissions = (state) => {
  const user = state.auth.user;
  return user?.isAdmin === true;
};

export const selectIsSystemAdmin = (state) => {
  return state.auth.user?.isAdmin === true;
};

export const selectCanBeAssignedTickets = (state) => {
  const user = state.auth.user;
  return user?.isAdmin === true;
};

export const selectShouldShowAssignedTickets = (state) => {
  return selectCanBeAssignedTickets(state);
};

export const { loginStart, loginSuccess, loginFailure, logout, updateUser, verifyAdmin } = authSlice.actions;
export default authSlice.reducer;