import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const httpLink = createHttpLink({
  uri: `${apiUrl}/graphql`,
});

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return { headers: { ...headers, authorization: token ? `Bearer ${token}` : '' } };
});

const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(createClient({
      url: `${apiUrl.replace(/^http/, 'ws')}/graphql`,
      connectionParams: () => ({
        authToken: localStorage.getItem('token') || '',
      }),
    }))
  : null;

const link = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
      },
      wsLink,
      authLink.concat(httpLink)
    )
  : authLink.concat(httpLink);

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});
