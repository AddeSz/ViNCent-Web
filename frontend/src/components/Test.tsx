import React from "react";
import { useEffect, useState } from "react";

const Test = (): React.JSX.Element => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(import.meta.env.VITE_BACKEND_URL + "/")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Not Working"));
  }, []);

  return (
    <>
      <h2>Typescript Works</h2>
      <h2>Backend {message || "Loading..."}</h2>
    </>
  );
};

export default Test;
