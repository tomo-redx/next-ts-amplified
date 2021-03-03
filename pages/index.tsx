// pages/index.ts
import { AmplifyAuthenticator } from "@aws-amplify/ui-react";
import {GraphQLResult} from '@aws-amplify/api'
import { Amplify, API, Auth, withSSRContext } from "aws-amplify";
import Head from "next/head";
import Link from 'next/link'
import awsExports from "../src/aws-exports";
import { createPost } from "../src/graphql/mutations";
import { listPosts } from "../src/graphql/queries";
import { ListPostsQuery } from '../src/API'
import { CreatePostMutation } from '../src/API'
import { CreatePostInput } from '../src/API'
import styles from "../styles/Home.module.css";
import { GetStaticProps, GetStaticPaths, GetServerSideProps } from 'next'
import { GRAPHQL_AUTH_MODE } from '@aws-amplify/api-graphql/lib/types';

Amplify.configure({...awsExports, ssr:true});

export async function getServerSideProps({req}){
  const SSR = withSSRContext({req})
  const response = await SSR.API.graphql({query: listPosts});

  return{
    props: {
      posts: response.data.listPosts.items,
    },
  };
}

async function handleCreatePost(event) {
  event.preventDefault();

  const form = new FormData(event.target);

  try{
    const {data} = await (API.graphql({
      authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
      query: createPost,
      variables: {
        input: {
          title: form.get('title'),
          content: form.get('content'),
        },
      },
    })) as GraphQLResult<CreatePostMutation>;

    window.location.href= `/posts/${data.createPost.id}`;
  }catch({errors}){
    console.error(...errors);
    throw new Error(errors[0].message);
  }
}

export default function Home({posts = []}) {
  return(
    <div>
      <Head>
        <title>Amplify + Next.js + TypeScript</title>
      </Head>

      <main>
        <h1>
          Amplify + Next.js + TypeScript
        </h1>

        <p>
          <code>
            {posts.length}
          </code>
        </p>

        <div>
          {posts.map((post) => (
            <Link href={`/posts/${post.id}`} key={post.id}>
              <a>
                <h3>{post.title}</h3>
                <p>{post.content}</p>
              </a>
            </Link>
          ))}

          <div>
            <h3>New Post</h3>

            <AmplifyAuthenticator>
              <form onSubmit={handleCreatePost}>
                <fieldset>
                  <legend>Title</legend>
                  <input 
                    defaultValue='飯行こうぜ'
                    name='title'
                  />
                </fieldset>

                <fieldset>
                  <legend>Content</legend>
                  <input 
                    defaultValue='やっぱ緊急事態宣言が解除してからにしよう'
                    name='content'
                  />
                </fieldset>

                <button>Create Post</button>
                <button onClick={() => Auth.signOut()}>Sign out</button>
              </form>
            </AmplifyAuthenticator>
          </div>
        </div>
      </main>
    </div>
  );
}