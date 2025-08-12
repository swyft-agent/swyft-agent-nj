// This file previously contained sample/dummy data
// All sample data has been removed to ensure only real database content is used
// The application now fetches all data dynamically from Supabase

export const EMPTY_STATE_MESSAGES = {
  noVacantUnits: "No vacant units found. Add your first property to get started.",
  noBuildings: "No buildings found. Add your first building to get started.",
  noTenants: "No tenants found. Add your first tenant to get started.",
  noInquiries: "No inquiries yet. Your property listings will start receiving inquiries soon.",
  noNotices: "No notices found. Create your first notice to get started.",
  noAds: "No ad campaigns found. Create your first ad to promote your properties.",
  noTransactions: "No transactions found. Your wallet activity will appear here.",
  noAnalytics: "No analytics data available yet. Data will appear as you add properties and receive inquiries.",
}

export const LOADING_MESSAGES = {
  loadingVacantUnits: "Loading vacant units...",
  loadingBuildings: "Loading buildings...",
  loadingTenants: "Loading tenants...",
  loadingInquiries: "Loading inquiries...",
  loadingNotices: "Loading notices...",
  loadingAds: "Loading ad campaigns...",
  loadingTransactions: "Loading transactions...",
  loadingAnalytics: "Loading analytics...",
}
