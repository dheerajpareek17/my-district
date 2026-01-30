
/**
 * Build system prompt based on request body constraints
 */
function buildSystemPrompt(requestBody) {
  const constraints = [];
  
  // Core constraints
  if (requestBody.budget) {
    constraints.push(`budget (₹${requestBody.budget} for ${requestBody.numberOfPeople} people)`);
  }
  if (requestBody.minimumRating) {
    constraints.push(`minimum rating (${requestBody.minimumRating}+)`);
  }
  
  // Travel and timing constraints
  if (requestBody.travelTolerance) {
    constraints.push(`travel time limit (max ${requestBody.travelTolerance} min per leg, check distanceKm and travelTimeMinutes)`);
  }
  if (requestBody.timeGapBetweenThings) {
    constraints.push(`preferred gap between activities (${requestBody.timeGapBetweenThings} min)`);
  }
  
  // Experience constraints
  if (requestBody.crowdTolerance) {
    constraints.push(`crowd tolerance (${requestBody.crowdTolerance})`);
  }
  if (requestBody.parkingAccessible) {
    constraints.push('parking required');
  }
  
  // User preferences and tags
  if (requestBody.extraInfo) {
    constraints.push(`user preferences: "${requestBody.extraInfo}" (match with tags field)`);
  }
  
  // Type-specific filters
  if (requestBody.dining) {
    const filters = [];
    if (requestBody.dining.type?.length) filters.push(`type: ${requestBody.dining.type.join(',')}`);
    if (requestBody.dining.cuisines?.length) filters.push(`cuisines: ${requestBody.dining.cuisines.join(',')}`);
    if (requestBody.dining.alcohol !== undefined) filters.push(`alcohol: ${requestBody.dining.alcohol}`);
    if (filters.length) constraints.push(`dining (${filters.join('; ')})`);
  }
  
  if (requestBody.event) {
    const filters = [];
    if (requestBody.event.type?.length) filters.push(`type: ${requestBody.event.type.join(',')}`);
    if (requestBody.event.venue?.length) filters.push(`venue: ${requestBody.event.venue.join(',')}`);
    if (filters.length) constraints.push(`event (${filters.join('; ')})`);
  }
  
  if (requestBody.activity) {
    const filters = [];
    if (requestBody.activity.type?.length) filters.push(`type: ${requestBody.activity.type.join(',')}`);
    if (requestBody.activity.venue?.length) filters.push(`venue: ${requestBody.activity.venue.join(',')}`);
    if (filters.length) constraints.push(`activity (${filters.join('; ')})`);
  }
  
  if (requestBody.play) {
    const filters = [];
    if (requestBody.play.type?.length) filters.push(`type: ${requestBody.play.type.join(',')}`);
    if (requestBody.play.venue?.length) filters.push(`venue: ${requestBody.play.venue.join(',')}`);
    if (requestBody.play.intensity?.length) filters.push(`intensity: ${requestBody.play.intensity.join(',')}`);
    if (filters.length) constraints.push(`play (${filters.join('; ')})`);
  }
  
  if (requestBody.movie) {
    const filters = [];
    if (requestBody.movie.genre?.length) filters.push(`genre: ${requestBody.movie.genre.join(',')}`);
    if (requestBody.movie.language?.length) filters.push(`language: ${requestBody.movie.language.join(',')}`);
    if (requestBody.movie.format?.length) filters.push(`format: ${requestBody.movie.format.join(',')}`);
    if (requestBody.movie.cast?.length) filters.push(`cast: ${requestBody.movie.cast.join(',')}`);
    if (filters.length) constraints.push(`movie (${filters.join('; ')})`);
  }
  
  const constraintsText = constraints.length > 0
    ? `Evaluate based on: ${constraints.join(', ')}.`
    : 'Evaluate all aspects.';
  
  return `You are a precise itinerary scoring engine. ${constraintsText}

EVALUATION GUIDELINES:

1. BUDGET COMPLIANCE (0-25 points):
   - Calculate total cost vs budget (pricePerPerson × numberOfPeople for all items)
   - Deduct points for exceeding budget
   - Reward optimal use of budget without overspending

2. TRAVEL & LOGISTICS (0-25 points):
   - Evaluate distanceKm and travelTimeMinutes between consecutive items
   - If travelTolerance specified: penalize heavily if any leg exceeds limit
   - Consider cumulative travel time impact on experience
   - Check if timeGapBetweenThings is respected between go outs
   - Validate go outs fit within venue operating hours (availableTimeStart to availableTimeEnd)

3. QUALITY & PREFERENCES (0-25 points):
   - Check minimumRating compliance (rating field)
   - Match extraInfo preferences with tags field
   - Evaluate crowdTolerance alignment
   - Verify parkingAccessible requirement if specified
   - Assess type-specific filters (cuisines, venue, type, genre, etc.)

4. EXPERIENCE FLOW (0-25 points):
   - Logical sequence of go outs
   - Variety and balance in the itinerary
   - Duration appropriateness for each go out
   - Overall coherence and quality of experience

SCORING RULES:
- Use FULL granular range 0-100 (e.g., 67, 73, 82, 91)
- Do NOT round to multiples of 5 or 10
- Be precise based on constraint violations/matches
- Penalize each constraint violation proportionally

OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure:
{
  "score": <integer 0-100>,
  "reasoning": "<detailed explanation of score with specific constraint analysis>"
}`;
}

/**
 * Score an itinerary using Groq AI
 */
export async function scoreItinerary(itinerary, requestBody) {
  try {
    const systemPrompt = buildSystemPrompt(requestBody);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL,
        temperature: 0,
        top_p: 1,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Itinerary:\n\`\`\`json\n${JSON.stringify(itinerary, null, 2)}\n\`\`\`\n\nScore this plan.`
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, response.statusText);
      return 50;
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content?.trim();
    
    try {
      // Parse JSON response
      const result = JSON.parse(responseText);
      const score = parseInt(result.score, 10);
      const reasoning = result.reasoning || 'No reasoning provided';

      if (isNaN(score) || score < 0 || score > 100) {
        console.error('Invalid score from AI:', score);
        return 50;
      }

      // Log the reasoning
      console.log('AI Score:', score);
      console.log('AI Reasoning:', reasoning);
      
      return score;
      
    } catch (parseError) {
      // Fallback: try to extract score as plain integer if JSON parsing fails
      console.warn('Failed to parse JSON response, trying plain integer extraction:', parseError.message);
      const score = parseInt(responseText, 10);
      
      if (isNaN(score) || score < 0 || score > 100) {
        console.error('Invalid score from AI:', responseText);
        return 50;
      }
      
      console.log('AI Score (fallback):', score);
      return score;
    }

  } catch (error) {
    console.error('Error scoring itinerary:', error);
    return 50;
  }
}

/**
 * Score multiple itineraries in parallel (with rate limiting)
 */
export async function scoreItineraries(itineraries, requestBody, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < itineraries.length; i += batchSize) {
    const batch = itineraries.slice(i, i + batchSize);
    const batchPromises = batch.map(itinerary => 
      scoreItinerary(itinerary, requestBody)
    );
    
    const scores = await Promise.all(batchPromises);
    
    batch.forEach((itinerary, idx) => {
      results.push({
        itinerary,
        score: scores[idx]
      });
    });
  }
  
  return results.sort((a, b) => b.score - a.score);
}
