import { useState, useEffect } from "react";
export default function ErrorCard({ message,displayErrorFlag,handleError }) {
  if (!displayErrorFlag) return null;
  return (
    <div className="p-4 bg-red-600 text-white rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button onClick={handleError} className="text-xl font-bold">
          x
        </button>
      </div>
      
    </div>
  );
}