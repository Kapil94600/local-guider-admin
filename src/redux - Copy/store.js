import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import userReducer from './slices/userSlice';
import guiderReducer from './slices/guiderSlice';
import photographerReducer from './slices/photographerSlice';
import placeReducer from './slices/placeSlice';
import reviewReducer from './slices/reviewSlice';
import favoriteReducer from './slices/favoriteSlice';
import bookingReducer from './slices/bookingSlice';
import paymentReducer from './slices/paymentSlice';
import roleRequestReducer from './slices/roleRequestSlice';
import notificationReducer from './slices/notificationSlice';
import sliderReducer from './slices/sliderSlice';   // ✅ New
import offerReducer from './slices/offerSlice';     // ✅ New
import idCardReducer from './slices/idCardSlice';   // ✅ New

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    users: userReducer,
    guiders: guiderReducer,
    photographers: photographerReducer,
    places: placeReducer,
    reviews: reviewReducer,
    favorites: favoriteReducer,
    bookings: bookingReducer,
    payments: paymentReducer,
    roleRequests: roleRequestReducer,
    notifications: notificationReducer,
    sliders: sliderReducer,      // ✅ New
    offers: offerReducer,        // ✅ New
    idCards: idCardReducer,      // ✅ New
  },
});