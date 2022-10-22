const dotenv = require("dotenv").config({path:"./.env"})
const { env } = require("process");
const { Octokit } = require("@octokit/core");
const { log } = require("console");
const fs  = require("fs");
const { readdir } = require("fs").promises;
module.exports = mainData();


var octokit = null;

async function GetAllRepos()
{
    const response = await octokit.graphql(
        `query myOrgRepos($queryString: String!) {
            search(query: $queryString, type: REPOSITORY, first: 10) {
              repositoryCount
              edges {
                node {
                  ... on Repository {
                    name
                    diskUsage
                    nameWithOwner
                    isPrivate
                  }
                }
              }
            }
          }`,{queryString:"org:oraw-lab"}
    );
    let ArrayOfReleventJson = [];
    for(const repo of response.search.edges)
    {
        if(repo.node.name.startsWith("Repo"))
        {
          // getting all info on repo (Web hooks, owner , repoName)
          var PlaceOfSlash = repo.node.nameWithOwner.indexOf("/");
          repo.node.nameWithOwner = repo.node.nameWithOwner.substr(0,PlaceOfSlash)
          const resOfHooks = await octokit.request('GET /repos/{owner}/{repo}/hooks', {
            owner: repo.node.nameWithOwner,
            repo: repo.node.name
            })
          repo["node"]["Webhooks"] = resOfHooks.data.length
          Repo = {};
          Repo.diskUsage = repo.node.diskUsage;
          Repo.RepoName = repo.node.name;
          Repo.owner = repo.node.nameWithOwner;
          Repo.isPrivate = repo.node.isPrivate;
          Repo.Webhooks = repo.node.Webhooks;
          ArrayOfReleventJson.push(Repo);
        }
    }

    return ArrayOfReleventJson;
}

// Listing all files in Repo
const getFileList = async (dirName) => {
  let files = [];
  const items = await readdir(dirName, { withFileTypes: true });

  for (const item of items) {
      if (item.isDirectory()) {
          files = [
              ...files,
              ...(await getFileList(`${dirName}/${item.name}`)),
          ];
      } else {
          files.push(`${dirName}/${item.name}`);
      }
  }

  return files;
};


async function GetYmlContect(ListOfAllFiles)
{
  for(const file of ListOfAllFiles)
  {
    if(file.endsWith(".yml"))
    {
      const data = fs.readFileSync(file,{encoding:'utf8', flag:'r'});
      return data;
    }
  }
}

async function mainData()
{
  try
  {
    octokit = new Octokit({auth: dotenv.parsed["TOKEN"]});

    var currentWorkingDir = process.cwd();
    var AllRevelentRepo = await GetAllRepos();
    for(const repo of AllRevelentRepo)
    {
      var files = await getFileList(currentWorkingDir + "\\" + repo.RepoName);
      repo["content"] = await GetYmlContect(files);
    }
    return AllRevelentRepo;
  }
  catch(err)
  {
    console.log(err);
    return [];
  }
}


mainData();