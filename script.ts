import fs from 'fs/promises';
import path from 'path';

type TypefullyTweet = {
  id: number;
  last_edited: string;
  preview: string;
  status: number;
  tags: null | string[]; // Ajustez si nécessaire
  errors: Record<string, unknown>; // Ajustez si nécessaire
  error_msg: null | string;
  scheduled_date: string;
  num_tweets: number;
  published_on: string;
  pinned: boolean;
  reply_to_status_url: null | string;
  twitter_post_enabled: boolean;
  twitter_status: number;
  linkedin_post_enabled: boolean;
  linkedin_post_id: number;
  linkedin_auto_sync_draft_content: boolean;
  typefully_post_enabled: boolean;
  is_publicly_shared: boolean;
  prompt: null | string;
  ai_prompt: null | string;
  draft_title: null | string;
};

type TypefullyResponse = {
  count: number;
  next: string;
  previous: string;
  results: TypefullyTweet[];
};

const getUrl = (page: number) =>
  `https://api.typefully.com/threads/?status=1&page=${page}&Session=${process.env.SESSION}`;

const getTweetAt = (page: number): Promise<TypefullyResponse> => {
  return fetch(getUrl(page)).then((res) => res.json());
};

const threads = [] as TypefullyTweet[];
const all = [] as TypefullyTweet[];

const savePath = path.join(process.cwd(), 'save');

const save = async () => {
  await fs.writeFile(
    path.join(savePath, 'threads.json'),
    JSON.stringify(threads, null, 2)
  );
  await fs.writeFile(path.join(savePath, 'all.json'), JSON.stringify(all, null, 2));
  const newThreads = threads.map((t) => {
    return {
      id: t.id,
      preview: t.preview,
      url: `https://typefully.com/?a=43394&d=${t.id}`,
      num_tweets: t.num_tweets,
    };
  });
  await fs.writeFile(
    path.join(savePath, 'clean-threads.json'),
    JSON.stringify(newThreads, null, 2)
  );
};

const script = async () => {
  let page = 1;
  let isNext = true;

  try {
    while (isNext) {
      const res = await getTweetAt(page);
      console.log('Get page', page, res.count);
      all.push(...res.results);
      const tmpThread = res.results.filter((t) => {
        return t.num_tweets > 1 && t.twitter_post_enabled === true;
      });
      threads.push(...tmpThread);
      isNext = !!res.next;
      page++;
    }
  } catch (e) {
    console.log('Error', e);
  }

  await save();
};

script();
