import { Octokit } from "@octokit/rest";

// Store the token in a variable
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// Initialize Octokit with the token
export const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// Function to validate GitHub token
export const validateGithubToken = () => {
  return GITHUB_TOKEN && GITHUB_TOKEN.length > 0;
};

export const getGistFileContent = async (gistIds) => {
  try {
    // Split the gistIds string into an array
    const ids = gistIds.split('&');
    
    // Use Promise.all to fetch all gists in parallel
    const promises = ids.map(async (gistId) => {
      const response = await octokit.request("GET /gists/{gist_id}", {
        gist_id: gistId.trim(),
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      return Object.values(response.data.files)[0].content;
    });

    const contents = await Promise.all(promises);
    console.log(`Fetched ${contents.length} gist(s) content`);
    
    // Parse all JSON contents and return as array
    return contents.map(content => JSON.parse(content));
    
  } catch (error) {
    console.error("Error fetching gist content:", error);
    throw error;
  }
};
