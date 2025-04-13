import './App.css';
import Home from './Home';
import ItemRegistry from './ItemRegistry/ItemRegistry';
import { useState, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
  
function App() {
  return (
    // <div className='bg-gray-100'>
      // <div className='max-w-md mx-auto bg-white shadow-md overflow-hidden'>
        // {/* <Header /> */}
        <div>
          {/* <Home /> */}
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/item-registry' element={<ItemRegistry />} />
            <Route path='/item-registry/:itemId' element={<ItemRegistry />} />
          </Routes>
        </div>
        // {/* 資産情報
        // <div className='p-4 border-b'>
        //   <p className='text-gray-500'>現在の総資産</p>
        //   <p className='text-3xl font-bold'>{totalAssets.toLocaleString()}円</p>
        // </div> */}
      // </div>
    // </div>
  );

}

export default App;
