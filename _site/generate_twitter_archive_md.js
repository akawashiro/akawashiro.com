import fs from "fs";

const input = fs.readFileSync("tweets.js", "utf8");

// JS代入を削除
const json = input.replace(/^window\.YTD\.tweets\.part0\s*=\s*/, "");
const tweets = JSON.parse(json);

// 日付でソート（新しい順）
tweets.sort((a, b) =>
  new Date(b.tweet.created_at) - new Date(a.tweet.created_at)
);

function toISO(dateStr) {
  return new Date(dateStr).toISOString().replace(".000", "");
}

function toDate(dateStr) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

// 期間取得
const newest = toDate(tweets[0].tweet.created_at);
const oldest = toDate(tweets[tweets.length - 1].tweet.created_at);

// ヘッダ
console.log(`---`);
console.log(`title: Twitter Archive from ${oldest} to ${newest}`);
console.log(`layout: default`);
console.log(`---`);
console.log();

for (const item of tweets) {
  const t = item.tweet;
  if (!t.full_text) continue;

  const date = toISO(t.created_at);

  console.log(`## ${date}`);
  console.log(`<p>${t.full_text}</p>`);
}
