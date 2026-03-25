import type { Stage } from "../../shared/stage";

const mockResponse =
  "🌴 Ah, Santorini, Greece! 🌊 What an amazing summer destination! 😍 Based on your request for a summer trip, I've created a personalized itinerary for you. Since you didn't specify any preferences, I'll create a balanced mix of cultural experiences, leisure time, food experiences, and light adventure.\n\n**Day 1: Arrival in Santorini**\n\n* Arrive at Santorini Airport (JTR)\n* Transfer to Hotel Mama's Home (4-star) or Hotel Blue Palace Resort & Spa (5-star), both located in Fira town\n* Spend the day relaxing on the hotel's poolside or exploring Fira town, a charming village with white buildings and blue-domed churches\n* Dinner: Enjoy fresh seafood at Waterfront taverna 🍽️\n\n**Day 2: Cultural Experiences**\n\n* Visit Akrotiri ruins, an ancient Minoan city (9th century BC)\n* Explore the Museum of Prehistoric Thira to learn about Santorini's history and culture\n* Lunch: Try Greek salad at a local restaurant in Fira town 🥗\n* Afternoon: Relax on the beach or take a leisurely walk around Oia village, famous for its stunning sunset views\n* Dinner: Savor Moussaka at a local restaurant in Fira town 🍴\n\n**Day 3: Beach Day and Sunset**\n\n* Spend the day relaxing on Perissa Beach, one of Santorini's most popular beaches\n* Lunch: Enjoy fresh seafood at Waterfront taverna 🌊\n* Afternoon: Visit Oia village to watch the breathtaking sunset from its famous caldera\n* Dinner: Try a traditional Greek dinner with live music and dance at a local restaurant in Fira town 💃\n\n**Day 4: Outdoor Adventure**\n\n* Rent a car and explore the island's scenic routes, stopping at picturesque villages and beaches along the way\n* Visit the ancient city of Akrotiri, a UNESCO World Heritage Site\n* Lunch: Try some Greek street food at a local taverna 🍔\n* Afternoon: Visit the famous black sand beach of Perissa Beach\n\n**Day 5: Festival Time!**\n\n* Attend the Santorini Festival, a celebration of music, dance, and theater performances (July only)\n* Enjoy traditional Greek cuisine and drinks during the festival\n* Dinner: Savor some local specialties at a food stall or restaurant within the festival area 🎉\n\n**Budget Breakdown:**\n\nHotel Mama's Home (4-star): $120/night x 5 nights = $600\nHotel Blue Palace Resort & Spa (5-star): $300/night x 5 nights = $1,500\n\nFood and activities: approximately $200-300 per person for the entire trip\n\n**Total Estimated Cost:** $800-2,100\n\nPlease note that these estimates are based on WORLD DATA and may vary depending on individual preferences and exchange rates.\n\nI hope you enjoy your summer trip to Santorini! 😊";

export const mockConversation = {
  "summer trip": mockResponse,
};

export const runLoadingStages = (setLoadingStage: (stage: Stage) => void) => {
  setTimeout(() => setLoadingStage("start"), 2000);
  setTimeout(() => setLoadingStage("resolve"), 4000);
  setTimeout(() => setLoadingStage("search"), 6000);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const mockItineraryApiCall = async (
  sendEvent: (type: string, data: string) => void,
) => {
  const chunks = mockResponse.match(/.{1,4}/gs);
  if (chunks) {
    await sleep(1000);
    sendEvent("status", "resolve");
    await sleep(1000);
    sendEvent("status", "search");
    await sleep(1000);
    sendEvent("status", "itinerary");

    for (const chunk of chunks) {
      await sleep(10);
      sendEvent("chunk", chunk);
    }
  }
};
