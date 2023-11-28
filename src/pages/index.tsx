import React, { useState, ChangeEvent } from "react";

// 型定義
type Tweet = {
  created_at: string;
  full_text: string;
  userName: string;
};

type UserNames = {
  user1: string;
  user2: string;
};

type Files = {
  file1: File | null;
  file2: File | null;
};

const TwitterArchiveViewer = () => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [userNames, setUserNames] = useState<UserNames>({
    user1: "",
    user2: "",
  });
  const [files, setFiles] = useState<Files>({ file1: null, file2: null });

  const loadTweets = async (
    file: File | null,
    userName: string
  ): Promise<Tweet[]> => {
    if (!file) return [];

    const reader = new FileReader();
    try {
      const data = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target.result as string);
        reader.onerror = (e) => reject(reader.error);
        reader.readAsText(file);
      });

      const jsonContent = data.split("=")[1].trim();
      const tweets = JSON.parse(jsonContent);
      return tweets.map((tweet: any) => ({ ...tweet.tweet, userName }));
    } catch (error) {
      console.error("Error reading file:", error);
      return [];
    }
  };

  const displayTweets = async () => {
    const tweets1 = await loadTweets(files.file1, userNames.user1);
    const tweets2 = await loadTweets(files.file2, userNames.user2);
    const allTweets = [...tweets1, ...tweets2].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    setTweets(allTweets);
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    fileKey: keyof Files
  ) => {
    setFiles((prev) => ({
      ...prev,
      [fileKey]: e.target.files ? e.target.files[0] : null,
    }));
  };

  const handleNameChange = (
    e: ChangeEvent<HTMLInputElement>,
    nameKey: keyof UserNames
  ) => {
    setUserNames((prev) => ({ ...prev, [nameKey]: e.target.value }));
  };

  return (
    <div className="container mx-auto p-4">
      {/* ファイルとユーザー名の入力 */}
      <div className="mb-4">
        <input
          type="file"
          accept=".js"
          className="border p-2 rounded"
          onChange={(e) => handleFileChange(e, "file1")}
        />
        <input
          type="text"
          placeholder="User 1's Name"
          className="border p-2 rounded ml-2"
          onChange={(e) => handleNameChange(e, "user1")}
        />
      </div>
      <div className="mb-4">
        <input
          type="file"
          accept=".js"
          className="border p-2 rounded"
          onChange={(e) => handleFileChange(e, "file2")}
        />
        <input
          type="text"
          placeholder="User 2's Name"
          className="border p-2 rounded ml-2"
          onChange={(e) => handleNameChange(e, "user2")}
        />
      </div>

      <button
        onClick={displayTweets}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4"
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
