import { Octokit } from "@octokit/rest";
import CryptoJS from "crypto-js";

const ENCRYPTED_GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN || "";
const GITHUB_TOKEN = CryptoJS.AES.decrypt(ENCRYPTED_GITHUB_TOKEN, process.env.REACT_APP_ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);

const getOctokit = () => {
  return new Octokit({
    auth: GITHUB_TOKEN,
  });
};

export const validateGithubToken = () => {
  return GITHUB_TOKEN && GITHUB_TOKEN.length > 0;
};

export const getGistFileContent = async (gistId) => {
  try {
    const octokit = getOctokit();
    const response = await octokit.request("GET /gists/{gist_id}", {
      gist_id: gistId,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    const fileContent = Object.values(response.data.files)[0].content;
    console.log("Fetched file content");
    return [JSON.parse(fileContent)];
  } catch (error) {
    console.error("Error fetching gist content:", error);
    throw error;
  }
};

export const visualizeAllGists = async () => {
  try {
    const octokit = getOctokit();
    const response = await octokit.gists.list({
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
      per_page: 100
    });

    const gistContents = response.data
      .map(gist => {
        try {
          const firstFile = Object.values(gist.files)[0];
          return [JSON.parse(firstFile.content)];
        } catch (error) {
          console.warn(`Skipping non-JSON gist: ${gist.id}`);
          return null;
        }
      })
      .filter(content => content !== null);

    return gistContents.flat();
    
  } catch (error) {
    console.error("Error fetching all gists:", error);
    throw error;
  }
}