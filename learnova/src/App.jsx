// import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import Home from "./pages/Home";
// import Login from "./pages/Login";
// import Quiz from "./pages/Quiz";
// import SignUp from "./pages/SignUp";
// import Dashboard from "./pages/Dashboard";
// import Result from "./pages/Result"; 
  

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/Login" element={<Login />} />
//         <Route path="/signUp" element={<SignUp/>} />
//         <Route path="/dashboard" element={<Dashboard />} />
//         <Route path="/quiz" element={<Quiz />} />
//         <Route path="/Result" element={<Result />} />
        
        
//       </Routes>
//     </Router>
//   );
// }

// export default App;




import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Quiz from "./pages/Quiz";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Result from "./pages/Result";
import Profile from "./pages/Profile"; // 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/result" element={<Result />} />
        <Route path="/profile" element={<Profile />} /> 
      </Routes>
    </Router>
  );
}

export default App;
