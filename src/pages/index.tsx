import React, { useState, ChangeEvent, useEffect, useRef } from "react";
import {
  openDB,
  saveToDB,
  getFromDB,
  saveImageToDB,
  clearDB,
} from "../utils/dbOperations";
import Image from "next/image";
import Link from "next/link";

// ツイートの型定義
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

// 日時を日本式にフォーマットする関数
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

// コンポーネント
const TwitterArchiveViewer = () => {
  const [allTweets, setAllTweets] = useState<Tweet[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userInputs, setUserInputs] = useState<UserInput[]>([
    { file: null, userName: "" },
  ]); // ユーザー入力フィールドのステート
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [maxTweetsToShow, setMaxTweetsToShow] = useState(100); // 初期値は300
  const [displayedTweets, setDisplayedTweets] = useState<Tweet[]>([]);
  const observer = useRef<IntersectionObserver>();
  const lastTweetElementRef = useRef(null); // 最後のツイート要素の参照

  useEffect(() => {
    setDisplayedTweets(tweets.slice(0, maxTweetsToShow));
  }, [tweets, maxTweetsToShow]);

  useEffect(() => {
    const dbName = "twitterArchiveViewer";
    const storeName = "tweets";
    openDB(dbName, 1, (db) => {
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    }).then((db) => {
      getFromDB(db, storeName, "tweets").then((tweets) => {
        if (tweets) {
          setAllTweets(tweets);
          setTweets(tweets);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && displayedTweets.length < tweets.length) {
        setMaxTweetsToShow((prev) => prev + maxTweetsToShow);
      }
    });

    if (lastTweetElementRef.current) {
      observer.current.observe(lastTweetElementRef.current);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [displayedTweets, maxTweetsToShow, tweets.length]);

  // ツイートに含まれる画像を表示する関数
  const renderMedia = (tweet: Tweet) => {
    // メディア（画像）が含まれているかをチェック
    const media = tweet.extended_entities?.media || [];
    return media.map((mediaItem, index) =>
      mediaItem.type === "photo" ? (
        <a href={mediaItem.media_url_https} target="_blank" key={index}>
          <Image
            src={mediaItem.media_url_https}
            alt="ツイート画像"
            width={100}
            height={100}
          />
        </a>
      ) : null
    );
  };

  // 期間に基づいてツイートをフィルタリングする関数
  const filterTweetsByDateRange = () => {
    const filtered = allTweets.filter((tweet) => {
      const tweetDate = new Date(tweet.created_at);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      return tweetDate >= startDate && tweetDate <= endDate;
    });
    setTweets(filtered);
  };

  // フィルターをリセットする関数
  const resetFilter = () => {
    setTweets(allTweets);
    setDateRange({ start: "", end: "" });
  };
  // ファイルからツイートを読み込む関数
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

  // ユーザー入力フィールドを追加する関数
  const addUserInput = () => {
    setUserInputs((prevInputs) => [
      ...prevInputs,
      { file: null, userName: "" },
    ]);
  };

  // ユーザー情報の変更ハンドラー
  const handleUserInputChange = (
    index: number,
    file: File | null,
    userName: string
  ) => {
    const newUserInputs = [...userInputs];
    newUserInputs[index] = { file, userName };
    setUserInputs(newUserInputs);
  };

  // 検索バーのイベントハンドラー
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query) {
      const filteredTweets = allTweets.filter(
        (tweet) =>
          tweet.full_text.includes(query) || tweet.userName.includes(query)
      );
      setTweets(filteredTweets);
    } else {
      setTweets(allTweets);
    }
  };

  const removeUserInput = (index: number) => {
    const newUserInputs = userInputs.filter((_, idx) => idx !== index);
    setUserInputs(newUserInputs);
  };

  return (
    <div className="container mx-auto p-4">
      {/* ユーザー入力フィールド */}
      {userInputs.map((input, index) => (
        <div key={index} className="mb-4">
          <input
            type="file"
            accept=".js"
            className="border p-2 rounded"
            onChange={(e) =>
              handleUserInputChange(
                index,
                e.target.files ? e.target.files[0] : null,
                input.userName
              )
            }
          />
          <input
            type="text"
            placeholder={`User ${index + 1}'s Name`}
            className="border p-2 rounded ml-2"
            value={input.userName}
            onChange={(e) =>
              handleUserInputChange(index, input.file, e.target.value)
            }
          />
          <button
            onClick={() => removeUserInput(index)}
            className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            -
          </button>
        </div>
      ))}

      {/* ユーザー入力フィールド追加ボタン */}
      <button
        onClick={addUserInput}
        className=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        ＋
      </button>

      {/* 検索バー */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="ツイート検索..."
          className="border p-2 rounded w-full"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* ツイートを表示するボタン */}
      <div
        className="flex 
      justify-start 
      md:flex-row gap-36"
      >
        <button
          onClick={displayTweets}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 mb-4"
        >
          表示
        </button>
        {/* ツイート時間を降順にする */}

        <button
          onClick={() => {
            clearDB();
            clearTweets();
          }}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 mb-4"
        >
          初期化
        </button>
      </div>

      {/* 期間選択フィールド */}
      <div className="mb-4">
        <input
          type="date"
          className="border p-2 rounded mr-2"
          value={dateRange.start}
          onChange={(e) =>
            setDateRange({ ...dateRange, start: e.target.value })
          }
        />
        <input
          type="date"
          className="border p-2 rounded mr-2"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
        />
        <button
          onClick={filterTweetsByDateRange}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          期間を設定
        </button>
        <button
          onClick={resetFilter}
          className="ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          リセット
        </button>
      </div>
      <div>
        <button
          onClick={() => {
            const sortedTweets = [...tweets];
            sortedTweets.sort((a, b) => {
              return (
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
              );
            });
            setTweets(sortedTweets);
          }}
          className="hover:bg-gray-200 font-bold py-2 px-4 rounded mt-4 mb-4 underline underline-thickness: 2 underline-offset-8"
        >
          新しい順
        </button>

        {/* ツイート時間を昇順にする */}
        <button
          onClick={() => {
            const sortedTweets = [...tweets];
            sortedTweets.sort((a, b) => {
              return (
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
              );
            });
            setTweets(sortedTweets);
          }}
          className="hover:bg-gray-200 font-bold py-2 px-4 rounded mt-4 mb-4 underline underline-thickness: 2 underline-offset-8"
        >
          古い順
        </button>
      </div>
      {/* ツイートの表示 */}
      <div id="timeline">
        {displayedTweets.map((tweet, index) => (
          <div
            key={index}
            className="tweet p-4 border-b"
            ref={
              index === displayedTweets.length - 1 ? lastTweetElementRef : null
            }
          >
            <strong className="font-bold">{tweet.userName}</strong>
            <br />
            <span className="text-sm text-gray-600">{tweet.created_at}</span>
            <br />
            <div className="mt-2">
              {tweet.full_text}
              <div className="media">{renderMedia(tweet)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TwitterArchiveViewer;
