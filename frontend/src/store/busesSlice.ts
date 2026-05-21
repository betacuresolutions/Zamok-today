import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { defaultBusDepartYmd, type BusSearchForm, type BusSearchQuery } from "@/lib/busSearch";

export type BusSearchPreferences = {
  openBookingInNewTab: boolean;
};

type BusesState = {
  lastQuery?: BusSearchQuery;
  searchForm: BusSearchForm;
  preferences: BusSearchPreferences;
};

const initialState: BusesState = {
  searchForm: {
    from: "",
    to: "",
    departDate: defaultBusDepartYmd(),
    findHotelsAtDestination: false
  },
  preferences: {
    openBookingInNewTab: true
  }
};

const busesSlice = createSlice({
  name: "buses",
  initialState,
  reducers: {
    setBusSearchForm: (state, action: PayloadAction<Partial<BusSearchForm>>) => {
      state.searchForm = { ...state.searchForm, ...action.payload };
    },
    setBusLastQuery: (state, action: PayloadAction<BusSearchQuery | undefined>) => {
      state.lastQuery = action.payload;
    },
    setBusPreferences: (state, action: PayloadAction<Partial<BusSearchPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    }
  }
});

export const { setBusSearchForm, setBusLastQuery, setBusPreferences } = busesSlice.actions;
export const busesReducer = busesSlice.reducer;
