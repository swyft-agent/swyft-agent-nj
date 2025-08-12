import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface DataAnalysis {
  detectedType: "tenants" | "buildings" | "expenses" | "units" | "payments" | "unknown"
  confidence: number
  normalizedData: any[]
  suggestions: string[]
  errors: string[]
}

export async function analyzeCSVData(headers: string[], sampleRows: any[]): Promise<DataAnalysis> {
  try {
    const prompt = `
Analyze this CSV data and determine what type of property management data it represents.

Headers: ${headers.join(", ")}

Sample rows (first 3):
${sampleRows
  .slice(0, 3)
  .map((row, i) => `Row ${i + 1}: ${Object.values(row).join(", ")}`)
  .join("\n")}

Possible data types:
1. tenants - Contains tenant information (name, email, phone, unit, rent, etc.)
2. buildings - Contains building/property information (name, address, units, etc.)
3. expenses - Contains expense/cost information (amount, category, date, vendor, etc.)
4. units - Contains unit/apartment information (unit number, rent, size, etc.)
5. payments - Contains payment/transaction information (amount, date, tenant, type, etc.)

Please respond with a JSON object containing:
{
  "detectedType": "one of: tenants|buildings|expenses|units|payments|unknown",
  "confidence": 0.0-1.0,
  "normalizedData": [array of objects with standardized field names],
  "suggestions": ["array of suggestions for data improvement"],
  "errors": ["array of potential data issues"]
}

For normalizedData, use these standard schemas:

TENANTS:
{
  "name": "string",
  "email": "string", 
  "phone": "string",
  "building": "string",
  "unit": "string",
  "move_in_date": "YYYY-MM-DD",
  "move_out_date": "YYYY-MM-DD or null",
  "monthly_rent": number,
  "status": "active|moving-out|moved-out",
  "rent_status": "current|late",
  "occupancy_status": "occupied|vacant",
  "arrears": number
}

BUILDINGS:
{
  "name": "string",
  "address": "string",
  "city": "string",
  "building_type": "string",
  "total_units": number,
  "floors": number,
  "year_built": number,
  "status": "active|maintenance|archived"
}

EXPENSES:
{
  "category": "string",
  "description": "string",
  "amount": number,
  "expense_date": "YYYY-MM-DD",
  "vendor": "string",
  "payment_method": "string",
  "status": "pending|paid|overdue"
}

UNITS:
{
  "unit_number": "string",
  "bedrooms": number,
  "bathrooms": number,
  "size_sqft": number,
  "rent_amount": number,
  "status": "vacant|occupied|maintenance"
}

PAYMENTS:
{
  "amount": number,
  "payment_type": "rent|deposit|maintenance|utility|late_fee|other",
  "payment_method": "string",
  "payment_date": "YYYY-MM-DD",
  "status": "pending|completed|failed|refunded",
  "reference_number": "string",
  "description": "string"
}

Transform the sample data to match the detected schema.
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a data analysis expert specializing in property management data. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    // Parse the JSON response
    const analysis = JSON.parse(content) as DataAnalysis

    return analysis
  } catch (error) {
    console.error("Error analyzing CSV data:", error)

    // Fallback analysis
    return {
      detectedType: "unknown",
      confidence: 0,
      normalizedData: [],
      suggestions: ["Unable to analyze data automatically. Please check the format."],
      errors: [`Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`],
    }
  }
}

export async function normalizeAllData(headers: string[], allRows: any[], detectedType: string): Promise<any[]> {
  try {
    const prompt = `
Transform ALL rows of this ${detectedType} data to match the standard schema.

Headers: ${headers.join(", ")}

Data (${allRows.length} rows):
${allRows.map((row, i) => `Row ${i + 1}: ${Object.values(row).join(", ")}`).join("\n")}

Transform each row to match the ${detectedType.toUpperCase()} schema and return as JSON array.
Ensure all required fields are present and data types are correct.
Use null for missing optional fields.
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a data transformation expert. Always respond with a valid JSON array of objects.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    return JSON.parse(content)
  } catch (error) {
    console.error("Error normalizing data:", error)
    return allRows // Return original data as fallback
  }
}
