import React, { useState, useEffect, useRef, useCallback } from "react";

const App = () => {
  const chunksInPage = 100;
  const [logData, setLogData] = useState("");
  const [page, setPage] = useState({
    startChunk: 0,
    finishChunk: chunksInPage,
  });

  const isLastRangeFetched = useRef(false);
  const isLoading = useRef(false);
  const totalChunks = useRef(0);
  const logContainerRef = useRef(null);
  const [isScrollDown, setIsScrollDown] = useState(true);

  const fetchChunks = async () => {
    if (isLoading.current) {
      return;
    }
    isLoading.current = true;

    try {
      const response = await fetch(
        `http://localhost:3000/view-log?start_chunk=${page.startChunk}&end_chunk=${page.finishChunk}`
      );

      if (!response.ok) {
        console.error("HTTP error:", response.status);
        return;
      }

      totalChunks.current = parseInt(
        response.headers.get("X-Total-Chunks"),
        10
      );

      isLastRangeFetched.current =
        response.headers.get("X-Is-Last-Range") === "true";

      const decoder = new TextDecoder("utf-8");
      const reader = response.body.getReader();

      let chunksText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });

        chunksText += chunkText;
      }

      setLogData(chunksText);
    } catch (error) {
      console.error("Error fetching log data:", error);
    } finally {
      isLoading.current = false;
    }
  };

  useEffect(() => {
    if (!isLastRangeFetched.current) {
      fetchChunks();
    }
  }, [page]);

  useEffect(() => {
    if (logContainerRef.current && isScrollDown) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }

    if (isLoading.current) {
      return;
    }

    setPage((prev) => {
      const fVal = prev.finishChunk + chunksInPage;
      const finishChunk =
        fVal > totalChunks.current ? totalChunks.current : fVal;
      return {
        startChunk: prev.finishChunk,
        finishChunk,
      };
    });
  }, [logData]);

  return (
    <>
      <div
        style={{
          height: "100vh",
          overflow: "auto",
          background: "rgb(251 251 251)",
          alignItems: "center",
          boxShadow: "inset 0 0 0 2px rgb(222, 223, 246)",
          display: "flex",
          flexDirection: "column",
          padding: "0 10px",
          position: "relative",
          color: "#000",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            backgroundColor: "rgb(248, 117, 117)",
            width: "70px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            color: "#2a931d",
            background: "#000",
            opacity: "0.9",
          }}
        >
          {totalChunks.current &&
            ((page.finishChunk / totalChunks.current) * 100).toFixed(0)}{" "}
          %
        </div>
        <pre
          ref={logContainerRef}
          style={{ overflowX: "hidden", width: "100%", padding: 0, margin: 0 }}
        >
          {" "}
          {logData}
        </pre>
        <div
          style={{
            backgroundColor: isScrollDown ? "green" : "#f87575",
            borderRadius: "4px",
            padding: "10px",
            cursor: "pointer",
            position: "absolute",
            bottom: "5px",
            right: "20px",
            color: "#fff",
          }}
          onClick={() => {
            setIsScrollDown(!isScrollDown);
          }}
        >
          Auto Scroll
        </div>
      </div>
    </>
  );
};

export default App;
