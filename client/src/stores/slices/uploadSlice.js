import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    images: [],
    uploading: false,
    uploadError: null,
    uploadProgress: 0
};

const uploadSlice = createSlice({
    name: 'upload',
    initialState,
    reducers: {
        startUpload(state) {
            state.uploading = true;
            state.uploadError = null;
            state.uploadProgress = 0;
        },
        setUploadProgress(state, action) {
            state.uploadProgress = action.payload;
        },
        addImage(state, action) {
            const image = action.payload;
            if (image && !state.images.find(img => img.id === image.id)) {
                state.images.push(image);
            }
        },
        removeImage(state, action) {
            const index = action.payload;
            if (index >= 0 && index < state.images.length) {
                state.images.splice(index, 1);
            }
        },
        clearImages(state) {
            state.images = [];
        },
        setUploadError(state, action) {
            state.uploadError = action.payload;
            state.uploading = false;
        },
        completeUpload(state) {
            state.uploading = false;
            state.uploadProgress = 100;
            state.uploadError = null;
        },
        resetUpload(state) {
            Object.assign(state, initialState);
        }
    }
});

export const {
    startUpload,
    setUploadProgress,
    addImage,
    removeImage,
    clearImages,
    setUploadError,
    completeUpload,
    resetUpload
} = uploadSlice.actions;

export default uploadSlice.reducer;