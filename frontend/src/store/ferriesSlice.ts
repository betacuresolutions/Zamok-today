import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { defaultFerryPassengers } from "@/lib/ferryPassengers";
import {
  defaultFerryDepartYmd,
  defaultFerryReturnYmd,
  type FerrySearchForm,
  type FerrySearchQuery
} from "@/lib/ferrySearch";

export type FerrySearchPreferences = {
  openBookingInNewTab: boolean;
};

type FerriesState = {
  lastQuery?: FerrySearchQuery;
  searchForm: FerrySearchForm;
  preferences: FerrySearchPreferences;
};

const depart = defaultFerryDepartYmd();

const initialState: FerriesState = {
  searchForm: {
    tripType: "roundTrip",
    from: "",
    to: "",
    departDate: depart,
    returnDate: defaultFerryReturnYmd(depart),
    passengers: defaultFerryPassengers()
  },
  preferences: {
    openBookingInNewTab: true
  }
};

const ferriesSlice = createSlice({
  name: "ferries",
  initialState,
  reducers: {
    setFerrySearchForm: (state, action: PayloadAction<Partial<FerrySearchForm>>) => {
      state.searchForm = { ...state.searchForm, ...action.payload };
    },
    setFerryLastQuery: (state, action: PayloadAction<FerrySearchQuery | undefined>) => {
      state.lastQuery = action.payload;
    },
    setFerryPreferences: (state, action: PayloadAction<Partial<FerrySearchPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    }
  }
});

export const { setFerrySearchForm, setFerryLastQuery, setFerryPreferences } = ferriesSlice.actions;
export const ferriesReducer = ferriesSlice.reducer;
