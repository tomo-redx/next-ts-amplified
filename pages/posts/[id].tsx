import { Amplify, API, withSSRContext } from "aws-amplify";
import Head from "next/head";
import { useRouter } from "next/router";
import awsExports from "../../src/aws-exports";
import { deletePost } from "../../src/graphql/mutations";
import { getPost, listPosts } from "../../src/graphql/queries";
import { GRAPHQL_AUTH_MODE } from '@aws-amplify/api-graphql/lib/types';

Amplify.configure({...awsExports, ssr: true});

export async function getStaticPaths() {
  const SSR = withSSRContext();
  const {data} = await (SSR.API.graphql({query: listPosts}));

  const paths = data.listPosts.items.map((post) => ({
    params: {id: post.id},
  }));

  return{
    fallback: true,
    paths,
  };
}

export async function getStaticProps({params}) {
  const SSR = withSSRContext();
  const {data} = await SSR.API.graphql({
    query: getPost,
    variables: {
      id: params.id,
    },
  });

  return {
    props: {
      post: data.getPost,
    },
  };
}

export default function Post({post}) {
  const router = useRouter();

  if(router.isFallback) {
    return(
      <div>
        <h1>Loading&hellip;</h1>
      </div>
    );
  }

  async function handleDelete() {
    try{
      await API.graphql({
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
        query: deletePost,
        variables: {
          input: { id: post.id },
        },
      });

      window.location.href = '/';
    } catch ({errors}) {
      console.error(...errors);
      throw new Error(errors[0].message);
    }
  }

  return (
    <div>
      <Head>
        <title>{post.title}</title>
      </Head>

      <main>
        <h1>{post.title}</h1>
        <p>{post.content}</p>
      </main>

      <footer>
        <button onClick={handleDelete}>Delete Post</button>
      </footer>
    </div>
  )
}