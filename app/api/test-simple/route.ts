export async function GET() {
  return new Response(
    JSON.stringify({
      status: "success",
      message: "Simple API test working",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}
