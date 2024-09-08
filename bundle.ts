
    import main from './src/node/index'
    const resolvers = undefined
    interface NodeEntrypointTemplate {
      events?: any,
      graphql?: any,
      routes?: any,
      statusTrack?: any,
    }
    const {events,
           graphql: Nresolvers,
           routes,
           statusTrack} = main as NodeEntrypointTemplate
    const graphql = Nresolvers || resolvers

    export {events, graphql, routes, statusTrack}
