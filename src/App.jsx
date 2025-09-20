
import { Route, Routes } from "react-router-dom";
import Nav from "./components/Nav.jsx";
import Homepage from "./components/Homepage/Homepage.jsx";
import { UnikProvider } from "./context/UnikProvider";
// import LoginRegister from "./components/LoginRegister";
import { useState } from "react";



function App() {
  // const [user, setUser] = useState(null);
  // if (!user) {
  //   // return <LoginRegister onLoginSuccess={setUser} />;
  // }
  // Bypass login for now, always show main app
  return (
    <UnikProvider>
      <div className="">
        <Nav />
        <Routes>
          <Route path="/" element={<Homepage />} />
        </Routes>
      </div>
    </UnikProvider>
  );
}

export default App;
