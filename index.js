
 const ApolloServer  = require ('@apollo/server');
 const startStandaloneServer = require('@apollo/server/standalone');
 const GetData = require('./QueryGit.js')


 const typeDefs = `type Repo{
    RepoName: String
    diskUsage: Int
    owner : String
    isPrivate : Boolean
    Webhooks : Int
    content : String
  }
    type Query{
        Repos: [Repo]
    }
    
 `;
    async function main()
    {
      let DataOfRepos = await GetData;
      const resolvers = {
              Query: {
                  Repos: () => DataOfRepos,
              },
            };
    const server = new ApolloServer.ApolloServer({
        typeDefs,
        resolvers,
      });
  const { url } = await startStandaloneServer.startStandaloneServer(server, {
    listen: { port: 4000 },
  });
  
  console.log(`🚀  Server ready at: ${url}`);
}

main();
