import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home.jsx";
import Auth from "./Pages/Auth.jsx"
import Landing from './Pages/Landing';
import GroupPage from './Pages/GroupPage';
import JobDescription from './Pages/JobDescription';
function App() {
  console.log("✅ App Loaded");

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/auth" element={<Auth/>}/>  
          <Route path="/group" element={<GroupPage/>}/>
          <Route path ="landing" element={<Landing/>}/>
          <Route path="/job-description" element={<JobDescription/>}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;