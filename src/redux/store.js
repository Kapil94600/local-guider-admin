// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import userReducer from './slices/userSlice';
import guiderReducer from './slices/guiderSlice';
import photographerReducer from './slices/photographerSlice';
import placeReducer from './slices/placeSlice';
import reviewReducer from './slices/reviewSlice';
import bookingReducer from './slices/bookingSlice';
import paymentReducer from './slices/paymentSlice';
import roleRequestReducer from './slices/roleRequestSlice';
import notificationReducer from './slices/notificationSlice';
import sliderReducer from './slices/sliderSlice';
import offerReducer from './slices/offerSlice';
import idCardReducer from './slices/idCardSlice';
// ✅ favoriteReducer removed

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    users: userReducer,
    guiders: guiderReducer,
    photographers: photographerReducer,
    places: placeReducer,
    reviews: reviewReducer,
    bookings: bookingReducer,
    payments: paymentReducer,
    roleRequests: roleRequestReducer,
    notifications: notificationReducer,
    sliders: sliderReducer,
    offers: offerReducer,
    idCards: idCardReducer,
    // ✅ favorites removed from store
  },
});