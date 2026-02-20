export async function analyzeTeam(teamData: any) {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: teamData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Analysis failed");
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
