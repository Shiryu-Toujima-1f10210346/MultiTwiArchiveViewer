import React, { useState, ChangeEvent } from "react";

// ツイートの型定義
type Tweet = {
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

  // ファイルからツイートを読み込む関数
  const loadTweets = async (
    file: File | null,
    userName: string
  ): Promise<Tweet[]> => {
    if (!file) return [];

    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result as string);
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

  // ツイートを表示する関数
  const displayTweets = async () => {
    let combinedTweets: Tweet[] = [];
    for (const input of userInputs) {
      const userTweets = await loadTweets(input.file, input.userName);
      combinedTweets = combinedTweets.concat(userTweets);
    }

    combinedTweets.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
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
        </div>
      ))}

      {/* ユーザー入力フィールド追加ボタン */}
      <button
        onClick={addUserInput}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        +
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
      <button
        onClick={displayTweets}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 mb-4"
      >
        表示
      </button>

      {/* ツイートの表示 */}
      <div id="timeline">
        {tweets.map((tweet, index) => (
          <div key={index} className="tweet p-4 border-b">
            <strong className="font-bold">{tweet.userName}</strong>
            <br />
            <span className="text-sm text-gray-600">{tweet.created_at}</span>
            <br />
            <p className="mt-2">{tweet.full_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TwitterArchiveViewer;
