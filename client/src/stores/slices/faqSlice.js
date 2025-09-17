import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    faqs: [],
    loading: false,
    error: null,
    currentFaq: null,
    categories: []
};

const faqSlice = createSlice({
    name: 'faqs',
    initialState,
    reducers: {
        startLoading(state) {
            state.loading = true;
            state.error = null;
        },
        setFaqs(state, action) {
            state.faqs = action.payload;
            
            const categoriesSet = new Set(action.payload.map(faq => faq.category));
            state.categories = [...categoriesSet];
            state.loading = false;
        },
        setCurrentFaq(state, action) {
            state.currentFaq = action.payload;
            state.loading = false;
        },
        addFaq(state, action) {
            state.faqs.push(action.payload);

            if (!state.categories.includes(action.payload.category)) {
                state.categories.push(action.payload.category);
            }
            state.loading = false;
        },
        updateFaq(state, action) {
            const updatedFaq = action.payload;
            state.faqs = state.faqs.map(faq => 
                faq._id === updatedFaq._id ? updatedFaq : faq
            );
            
            if (state.currentFaq && state.currentFaq._id === updatedFaq._id) {
                state.currentFaq = updatedFaq;
            }
            
            const categoriesSet = new Set(state.faqs.map(faq => faq.category));
            state.categories = [...categoriesSet];
            
            state.loading = false;
        },
        deleteFaq(state, action) {
            const faqId = action.payload;
            state.faqs = state.faqs.filter(faq => faq._id !== faqId);
            
            if (state.currentFaq && state.currentFaq._id === faqId) {
                state.currentFaq = null;
            }
            
            const categoriesSet = new Set(state.faqs.map(faq => faq.category));
            state.categories = [...categoriesSet];
            
            state.loading = false;
        },
        setError(state, action) {
            state.error = action.payload;
            state.loading = false;
        }
    }
});

export const {
    startLoading,
    setFaqs,
    setCurrentFaq,
    addFaq,
    updateFaq,
    deleteFaq,
    setError
} = faqSlice.actions;

export default faqSlice.reducer;