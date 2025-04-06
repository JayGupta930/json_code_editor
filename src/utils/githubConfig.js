// GitHub API constants
const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const getGistFileContent = async (gistId) => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/reports/${gistId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const fileContent = Object.values(data.data.files)[0].content;
    console.log("Fetched file content");
    return [JSON.parse(fileContent)];
  } catch (error) {
    console.error("Error fetching gist content:", error);
    throw error;
  }
};

const batchProcess = async (items, batchSize = 5) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  return results;
};

export const visualizeAllGists = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/reports`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched all gists", data);

    // Prepare all fetch promises
    const fetchPromises = data.data.map((gist) => {
      const firstFile = Object.values(gist.files)[0];
      if (!firstFile.raw_url) {
        console.warn(`No raw_url found for gist: ${gist.id}`);
        return Promise.resolve(null);
      }

      return fetch(firstFile.raw_url)
        .then((response) =>
          response.ok
            ? response.text()
            : Promise.reject(`Failed to fetch: ${response.status}`)
        )
        .then((content) => [JSON.parse(content)])
        .catch((error) => {
          console.warn(`Error processing gist ${gist.id}:`, error);
          return null;
        });
    });

    // Process in batches
    const gistContents = await batchProcess(fetchPromises);
    return gistContents.filter((content) => content !== null).flat();
  } catch (error) {
    console.error("Error fetching all gists:", error);
    throw error;
  }
};
