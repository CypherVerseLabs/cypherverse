import { Message } from "cyengine/dist/layers/Network/logic/channels";

type CountdownState = {
  timeLeft: number;
  running: boolean;
};

type CountdownAction =
  | { type: "START"; time: number }
  | { type: "TICK" }
  | { type: "STOP" };

function countdownReducer(message: Message<CountdownAction>, state: CountdownState): CountdownState {
  const { data } = message;
  switch (data.type) {
    case "START":
      return { timeLeft: data.time, running: true };
    case "TICK":
      return { timeLeft: Math.max(state.timeLeft - 1, 0), running: state.timeLeft > 0 };
    default:
      return state;
  }
}
