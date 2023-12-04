import Link from "next/link";
import React from "react";
import Image from "next/image";

function index() {
  return (
    <div className="container mx-auto p-4">
      <div className="font-bold text-3xl">
        使い方 <span className="text-xl font-thin">How to use</span>
        <Link href="/">
          <p className="text-blue-500 hover:underline ml-8">戻る↲</p>
        </Link>
      </div>
    </div>
  );
}

export default index;
