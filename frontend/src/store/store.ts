import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/store/authSlice";
import { flightsReducer } from "@/store/flightsSlice";
import { carsReducer } from "@/store/carsSlice";
import { hotelsReducer } from "@/store/hotelsSlice";
import { localeReducer } from "@/store/localeSlice";
import { walletReducer } from "@/store/walletSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    flights: flightsReducer,
    hotels: hotelsReducer,
    cars: carsReducer,
    locale: localeReducer,
    wallet: walletReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

