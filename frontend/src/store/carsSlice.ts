import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_DRIVER_AGE, type CarSearchForm, type CarSearchQuery } from "@/lib/carSearch";

export type CarSearchPreferences = {
  openBookingInNewTab: boolean;
};

type CarsState = {
  lastQuery?: CarSearchQuery;
  searchForm: CarSearchForm;
  preferences: CarSearchPreferences;
};

const initialState: CarsState = {
  searchForm: {
    pickUpCity: "",
    pickUpSubtitle: "",
    dropOffCity: "",
    dropOffSubtitle: "",
    pickUpDate: "",
    dropOffDate: "",
    pickUpTime: "10:30",
    dropOffTime: "10:30",
    driverAge: DEFAULT_DRIVER_AGE
  },
  preferences: {
    openBookingInNewTab: true
  }
};

const carsSlice = createSlice({
  name: "cars",
  initialState,
  reducers: {
    setCarSearchForm: (state, action: PayloadAction<Partial<CarSearchForm>>) => {
      state.searchForm = { ...state.searchForm, ...action.payload };
    },
    setCarLastQuery: (state, action: PayloadAction<CarSearchQuery | undefined>) => {
      state.lastQuery = action.payload;
    },
    setCarPreferences: (state, action: PayloadAction<Partial<CarSearchPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    }
  }
});

export const { setCarSearchForm, setCarLastQuery, setCarPreferences } = carsSlice.actions;
export const carsReducer = carsSlice.reducer;
