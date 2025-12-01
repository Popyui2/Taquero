/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Application
  readonly VITE_APP_PASSWORD?: string

  // Google Sheets URLs
  readonly VITE_TEMPERATURE_SHEET_URL?: string
  readonly VITE_COOKING_BATCH_SHEET_URL?: string
  readonly VITE_INCIDENTS_SHEET_URL?: string
  readonly VITE_STAFF_SICKNESS_SHEET_URL?: string
  readonly VITE_PROVING_METHODS_SHEET_URL?: string
  readonly VITE_COMPLAINTS_SHEET_URL?: string
  readonly VITE_ALLERGENS_SHEET_URL?: string
  readonly VITE_SUPPLIERS_SHEET_URL?: string
  readonly VITE_DELIVERIES_SHEET_URL?: string
  readonly VITE_TRANSPORT_TEMP_SHEET_URL?: string
  readonly VITE_B2B_SALES_SHEET_URL?: string
  readonly VITE_CLEANING_SHEET_URL?: string
  readonly VITE_EQUIPMENT_SHEET_URL?: string
  readonly VITE_TRACEABILITY_SHEET_URL?: string
  readonly VITE_COOLING_BATCH_SHEET_URL?: string
  readonly VITE_PROVING_COOLING_SHEET_URL?: string
  readonly VITE_PROVING_REHEATING_SHEET_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
