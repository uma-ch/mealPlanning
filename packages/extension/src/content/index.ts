// Content script - extracts recipe data from webpage
export function extractRecipeData() {
  // Look for Schema.org Recipe JSON-LD
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      if (data['@type'] === 'Recipe' || (Array.isArray(data) && data.some(item => item['@type'] === 'Recipe'))) {
        const recipe = Array.isArray(data) ? data.find(item => item['@type'] === 'Recipe') : data;
        return {
          title: recipe.name,
          ingredients: Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient.join('\n') : '',
          instructions: extractInstructions(recipe.recipeInstructions),
          imageUrl: recipe.image?.url || recipe.image,
          source: 'schema.org',
        };
      }
    } catch (e) {
      console.error('Failed to parse JSON-LD:', e);
    }
  }

  // Fallback: save full page HTML
  return {
    title: document.title,
    rawHtml: document.documentElement.outerHTML,
    source: 'fallback',
  };
}

function extractInstructions(instructions: any): string {
  if (typeof instructions === 'string') return instructions;
  if (Array.isArray(instructions)) {
    return instructions.map(step => {
      if (typeof step === 'string') return step;
      if (step.text) return step.text;
      return '';
    }).join('\n');
  }
  return '';
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    const data = extractRecipeData();
    sendResponse({ success: true, data });
  }
  return true;
});
