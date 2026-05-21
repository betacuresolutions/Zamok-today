import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { HotelGuestsState, HotelSearchQuery } from "@/lib/hotelSearch";

export type HotelSearchForm = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: HotelGuestsState;
};

export type HotelSearchPreferences = {
  travelForWork: boolean;
  openBookingInNewTab: boolean;
};

type HotelsState = {
  lastQuery?: HotelSearchQuery;
  searchForm: HotelSearchForm;
  preferences: HotelSearchPreferences;
};

const defaultGuests: HotelGuestsState = {
  adults: 2,
  children: 0,
  rooms: 1
};

const initialState: HotelsState = {
  searchForm: {
    destination: "",
    checkIn: "",
    checkOut: "",
    guests: defaultGuests
  },
  preferences: {
    travelForWork: false,
    openBookingInNewTab: true
  }
};

const hotelsSlice = createSlice({
  name: "hotels",
  initialState,
  reducers: {
    setHotelSearchForm: (state, action: PayloadAction<Partial<HotelSearchForm>>) => {
      state.searchForm = {
        ...state.searchForm,
        ...action.payload,
        guests: {
          ...state.searchForm.guests,
          ...(action.payload.guests || {})
        }
      };
    },
    setHotelLastQuery: (state, action: PayloadAction<HotelSearchQuery | undefined>) => {
      state.lastQuery = action.payload;
    },
    setHotelPreferences: (state, action: PayloadAction<Partial<HotelSearchPreferences>>) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload
      };
    }
  }
});

export const { setHotelSearchForm, setHotelLastQuery, setHotelPreferences } = hotelsSlice.actions;
export const hotelsReducer = hotelsSlice.reducer;
