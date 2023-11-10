import { execSync } from 'child_process';
import fetch from 'node-fetch';

export const reportError = async (e: any) => {
  console.error(e);
  if (process.env.DEVTOOLS_DEV) {
    return;
  }
  let repo = '';
  let branch = '';
  let author = '';
  try {
    repo = process.env.CI_REPO_NAME || execSync('git remote -v').toString();
    branch =
      process.env.CI_EVENT_CHANGE_SOURCE_BRANCH ||
      execSync('git branch --show-current').toString();
    author =
      process.env.CI_ACTOR || execSync('git config user.email').toString();
  } catch (e) {
    console.log(e);
  }
  await fetch(
    'https://open.feishu.cn/open-apis/bot/v2/hook/61f3b3be-3451-4ce5-b2ad-c74690669d82',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify({
        msg_type: 'text',
        content: {
          text: JSON.stringify({
            error: e?.message || e,
            repo,
            branch,
            author,
          }),
        },
      }),
    },
  )
    // eslint-disable-next-line no-return-await
    .then(async (res) => await res.json())
    .then((res) => console.log(res))
    .catch((e) => console.error(e));
};
