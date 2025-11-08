// Google Sheets API Module
const SheetsAPI = {
    // Your Google Sheets configuration
    SPREADSHEET_ID: '', // You'll need to set this
    API_KEY: '', // You'll need to set this (optional if using OAuth)

    // Sheet names for different record types
    SHEETS: {
        temperature: 'Temperature Logs',
        cleaning: 'Cleaning Checklist',
        delivery: 'Delivery Logs',
        incident: 'Incident Reports',
        staff: 'Staff Records'
    },

    // Initialize the Sheets API
    async init() {
        // Load the Google Sheets API
        await this.loadGapi();
    },

    // Load Google API
    loadGapi() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                gapi.load('client', async () => {
                    await gapi.client.init({
                        apiKey: this.API_KEY,
                        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
                    });
                    resolve();
                });
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    },

    // Append a row to a sheet
    async appendRow(sheetName, values) {
        try {
            // Set access token from Auth
            if (Auth.accessToken) {
                gapi.client.setToken({ access_token: Auth.accessToken });
            }

            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.SPREADSHEET_ID,
                range: `${sheetName}!A:Z`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [values]
                }
            });

            return response.result;
        } catch (error) {
            console.error('Error appending to sheet:', error);
            throw error;
        }
    },

    // Get all values from a sheet
    async getSheetData(sheetName, range = 'A:Z') {
        try {
            if (Auth.accessToken) {
                gapi.client.setToken({ access_token: Auth.accessToken });
            }

            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.SPREADSHEET_ID,
                range: `${sheetName}!${range}`
            });

            return response.result.values || [];
        } catch (error) {
            console.error('Error reading sheet:', error);
            throw error;
        }
    },

    // Save temperature log
    async saveTemperatureLog(data) {
        const timestamp = new Date().toISOString();
        const values = [
            timestamp,
            Auth.currentUser.name,
            Auth.currentUser.email,
            data.type,
            data.location,
            data.temperature,
            data.notes || ''
        ];

        await this.appendRow(this.SHEETS.temperature, values);
    },

    // Alternative: Use fetch API to append to Google Sheets
    // This method works without gapi if you set up a Google Apps Script Web App
    async appendViaWebApp(webAppUrl, data) {
        try {
            const response = await fetch(webAppUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            return { success: true };
        } catch (error) {
            console.error('Error posting to web app:', error);
            throw error;
        }
    }
};

// Simplified Sheets Integration using fetch
// This is a simpler alternative that doesn't require the full Google Sheets API
const SimpleSheetsAPI = {
    WEB_APP_URL: '', // You'll set this to your Google Apps Script Web App URL

    // Save any record
    async saveRecord(recordType, data) {
        const payload = {
            sheetName: recordType,
            timestamp: new Date().toISOString(),
            user: Auth.currentUser.name,
            email: Auth.currentUser.email,
            data: data
        };

        try {
            const response = await fetch(this.WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            // Note: no-cors mode doesn't allow reading the response
            // We assume success if no error is thrown
            return { success: true };
        } catch (error) {
            console.error('Error saving record:', error);
            throw error;
        }
    },

    // Save temperature log
    async saveTemperatureLog(data) {
        return await this.saveRecord('Temperature Logs', data);
    }
};
