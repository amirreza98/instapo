import { useState } from "react";
import MinimalGame from "./component/MinimalGame";
import PinballGame from "./component/PinballGame";
function Game() {
  const text = "Click Back Home";
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });


  return (
    <section className="w-full flex-col max-sm:flex-col overflow-clip items-center max-sm:items-start h-full text-white">

      {/* game */}
      <div className="relative max-sm:top-1/2 max-sm:w-11/12 bg-white/30 flex justify-center items-center border-2 border-gray-500 m-5 rounded-lg">
        <MinimalGame /> 

      </div>
      <div 
        className="relative max-sm:bottom-1/2 max-sm:ml-5 cursor-pointer">
            <PinballGame />
        </div>
    </section>
  );
}
export default Game;
