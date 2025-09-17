import { createSlice } from "@reduxjs/toolkit";
import { getAllUsers, getAllAdmins } from "../thunks/userThunks";

const initialState = {
    users: [],
    admins: [],
    loading: false,
    error: null,
    selectedUser: null
};

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        startLoading(state) {
            state.loading = true;
            state.error = null;
        },
        setUsers(state, action) {
            state.users = action.payload;
            state.loading = false;
        },
        setSelectedUser(state, action) {
            state.selectedUser = action.payload;
            state.loading = false;
        },
        addUser(state, action) {
            state.users.push(action.payload);
            state.loading = false;
        },
        updateUser(state, action) {
            const updatedUser = action.payload;
            state.users = state.users.map(user => 
                user._id === updatedUser._id ? updatedUser : user
            );
            
            if (state.selectedUser && state.selectedUser._id === updatedUser._id) {
                state.selectedUser = updatedUser;
            }
            
            state.loading = false;
        },
        deleteUser(state, action) {
            const userId = action.payload;
            state.users = state.users.filter(user => user._id !== userId);
            
            if (state.selectedUser && state.selectedUser._id === userId) {
                state.selectedUser = null;
            }
            
            state.loading = false;
        },
        setError(state, action) {
            state.error = action.payload;
            state.loading = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(getAllUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(getAllAdmins.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllAdmins.fulfilled, (state, action) => {
                state.loading = false;
                state.admins = action.payload;
            })
            .addCase(getAllAdmins.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const {
    startLoading,
    setUsers,
    setSelectedUser,
    addUser,
    updateUser,
    deleteUser,
    setError
} = usersSlice.actions;

export default usersSlice.reducer;
