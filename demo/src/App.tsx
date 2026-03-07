import { useState } from "react";
import "./App.css";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Counter</h1>
      <div className="counter">
        <button onClick={() => setCount((c) => c - 1)}>-</button>
        <span className="count">{count}</span>
        <button onClick={() => setCount((c) => c + 1)}>+</button>
      </div>
      <div className="reset-row">
        <button
          className="reset-btn"
          disabled={count === 0}
          onClick={() => setCount(0)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
