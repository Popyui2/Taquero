import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TemperatureRecord } from '@/types'

// Google Sheets webhook URL - same as used for writing
const GOOGLE_SHEETS_WEBHOOK = import.meta.env.VITE_TEMPERATURE_SHEET_URL || 'https://script.google.com/macros/s/AKfycbz27gmlc2swJgIXdayBHnP-b3KMIR-TiuY6Ib35piYo8m0TYDD1SzFbEDp2Q1EeywQg/exec'

interface TemperatureState {
  // State
  temperatureRecords: TemperatureRecord[]
  isLoading: boolean
  lastFetchTime: string | null
  fetchError: string | null

  // Actions
  fetchFromGoogleSheets: () => Promise<void>
  addLocalRecord: (record: TemperatureRecord) => void
  getTodayRecord: () => TemperatureRecord | null
  setLoading: (loading: boolean) => void
}

export const useTemperatureStore = create<TemperatureState>()(
  persist(
    (set, get) => ({
      // Initial state
      temperatureRecords: [],
      isLoading: false,
      lastFetchTime: null,
      fetchError: null,

      // Set loading state
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // Fetch data from Google Sheets
      fetchFromGoogleSheets: async () => {
        console.log('🔄 fetchFromGoogleSheets called for temperatures')

        set({ isLoading: true, fetchError: null })

        try {
          const response = await fetch(GOOGLE_SHEETS_WEBHOOK, {
            method: 'GET',
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()

          if (result.success && result.data) {
            // Update state with fetched data
            set({
              temperatureRecords: result.data,
              lastFetchTime: new Date().toISOString(),
              fetchError: null,
            })
            console.log('✅ Temperature records fetched:', result.data.length)
          } else {
            throw new Error(result.error || 'Failed to fetch data')
          }
        } catch (error) {
          console.error('Error fetching from Google Sheets:', error)
          set({
            fetchError: error instanceof Error ? error.message : 'Unknown error',
          })
          // Keep using cached data from localStorage
        } finally {
          set({ isLoading: false })
        }
      },

      // Add a record locally (after successful submission)
      addLocalRecord: (record: TemperatureRecord) => {
        set((state) => ({
          temperatureRecords: [record, ...state.temperatureRecords],
        }))
      },

      // Get today's record if it exists
      getTodayRecord: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().temperatureRecords.find((record) => record.date === today) || null
      },
    }),
    {
      name: 'taquero-temperature',
    }
  )
)
