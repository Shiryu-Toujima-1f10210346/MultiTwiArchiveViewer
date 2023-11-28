import React, { useState, ChangeEvent, useEffect } from "react";

type Tweet = {
  created_at: string;
  full_text: string;
  userName: string;
};

type UserInput = {
  fileData: string; // Base64エンコードされたファイルデータ
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

const TwitterArchiveViewer = () => {
  const [allTweets, setAllTweets] = useState<Tweet[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userInputs, setUserInputs] = useState<UserInput[]>([
    { fileData: "", userName: "" },
  ]);

  useEffect(() => {
    const savedData = localStorage.getItem("userInputs");
    if (savedData) {
      setUserInputs(JSON.parse(savedData));
    }
  }, []);

  const saveToLocalStorage = () => {
    localStorage.setItem("userInputs", JSON.stringify(userInputs));
    window.alert("保存しました");
  };

  const loadTweets = async (
    fileData: string,
    userName: string
  ): Promise<Tweet[]> => {
    if (!fileData) return [];

    try {
      const window = { YTD: { tweets: { part0: [] } } }; // ダミーオブジェクト
      eval(fileData); // ファイルから読み込んだスクリプトを実行
      const loadedTweets = window.YTD.tweets.part0 as any[];

      return loadedTweets.map((tweetData) => ({
        ...tweetData.tweet,
        created_at: formatDate(tweetData.tweet.created_at),
        userName,
      }));
    } catch (error) {
      console.error("Error processing file data:", error);
      return [];
    }
  };

  const displayTweets = async () => {
    let combinedTweets: Tweet[] = [];
    for (const input of userInputs) {
      const userTweets = await loadTweets(input.fileData, input.userName);
      combinedTweets = combinedTweets.concat(userTweets);
    }

    combinedTweets.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    setAllTweets(combinedTweets);
    setTweets(combinedTweets);
  };

  const addUserInput = () => {
    setUserInputs((prevInputs) => [
      ...prevInputs,
      { fileData: "", userName: "" },
    ]);
  };

  const handleUserInputChange = async (
    index: number,
    file: File | null,
    userName: string
  ) => {
    let fileData = "";
    if (file) {
      fileData = await fileToBase64(file);
    }

    const newUserInputs = [...userInputs];
    newUserInputs[index] = { fileData, userName };
    setUserInputs(newUserInputs);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

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
      {userInputs.map((input, index) => (
        <div key={index} className="mb-4 flex items-center">
          <div className="flex-grow">
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
                handleUserInputChange(index, null, e.target.value)
              }
            />
            <button
              onClick={() => removeUserInput(index)}
              className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              -
            </button>
            {/* {userInputs.length > 1 && (
              <button
                onClick={() => removeUserInput(index)}
                className="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                -
              </button>
            )} */}
          </div>
        </div>
      ))}

      <button
        onClick={addUserInput}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        +
      </button>

      <button
        onClick={saveToLocalStorage}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mx-6 px-4 rounded mb-4"
      >
        保存
      </button>

      <div className="mb-4">
        <input
          type="text"
          placeholder="ツイート検索..."
          className="border p-2 rounded"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <button
        onClick={displayTweets}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 mb-4"
      >
        表示
      </button>

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
