import { useState, useEffect, useMemo } from "react";
import { openDB, saveToDB } from "@/utils/dbOperations";

type Tweet = {
  extended_entities: {
    media: {
      media_url_https: string;
      type: string;
    }[];
  };
  created_at: string;
  full_text: string;
  userName: string;
};

// ユーザー入力の型定義
type UserInput = {
  file: File | null;
  userName: string;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatter.format(date);
};

export const useTweets = () => {
  const [userInputs, setUserInputs] = useState<UserInput[]>([
    { file: null, userName: "" },
  ]);
  const [allTweets, setAllTweets] = useState<Tweet[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  const loadTweets = async (
    file: File | null,
    userName: string
  ): Promise<Tweet[]> => {
    if (!file) return [];

    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(reader.error);
        reader.readAsText(file);
      });

      const window = { YTD: { tweets: { part0: [] } } }; // ダミーオブジェクト
      eval(data); // ファイルから読み込んだスクリプトを実行
      const loadedTweets = window.YTD.tweets.part0 as any[];

      return loadedTweets.map((tweetData) => ({
        ...tweetData.tweet,
        created_at: formatDate(tweetData.tweet.created_at),
        userName,
      }));
    } catch (error) {
      console.error("Error reading file:", error);
      return [];
    }
  };

  const filterTweetsByDateRange = () => {
    const filtered = allTweets.filter((tweet) => {
      const tweetDate = new Date(tweet.created_at);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      //開始日のみ指定されている場合､開始日以降のツイートを表示
      if (!dateRange.end) return tweetDate >= startDate;
      //終了日のみ指定されている場合､終了日以前のツイートを表示
      if (!dateRange.start) return tweetDate <= endDate;
      //開始日と終了日が指定されている場合､その範囲内のツイートを表示
      return tweetDate >= startDate && tweetDate <= endDate;
    });
    setTweets(filtered);
  };

  // 画像を含むツイートのみを表示する関数
  const displayTweetsIncludesImages = () => {
    const filtered = allTweets.filter((tweet) =>
      tweet.extended_entities?.media.some(
        (mediaItem) => mediaItem.type === "photo"
      )
    );
    setTweets(filtered);
  };

  // フィルターをリセットする関数
  const resetFilter = () => {
    setTweets(allTweets);
    setDateRange({ start: "", end: "" });
  };

  const clearTweets = () => {
    setAllTweets([]);
    setTweets([]);
  };

  // ツイートを表示する関数
  const displayTweets = async () => {
    let combinedTweets: Tweet[] = [];
    for (const input of userInputs) {
      const userTweets = await loadTweets(input.file, input.userName);
      combinedTweets = combinedTweets.concat(userTweets);
    }

    combinedTweets.sort((a, b) => {
      // Add your sorting logic here
      // For example, sorting by created_at in descending order
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    const dbName = "twitterArchiveViewer";
    const storeName = "tweets";
    openDB(dbName, 1, (db) => {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    }).then((db) => {
      saveToDB(db, storeName, "tweets", combinedTweets);
    });

    setAllTweets(combinedTweets);
    setTweets(combinedTweets);
  };

  return {
    userInputs,
    setUserInputs,
    tweets,
    setTweets,
    allTweets,
    setAllTweets,
    dateRange,
    setDateRange,
    loadTweets,
    filterTweetsByDateRange,
    resetFilter,
    clearTweets,
    displayTweets,
    displayTweetsIncludesImages,
  };
};
