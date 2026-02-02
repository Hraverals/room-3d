import { BrowserRouter, Routes, Route } from 'react-router';

import Home from './pages/Home';
import RoomList from './pages/RoomList';
import RoomWrite from './pages/RoomWrite';
import RoomDetail from './pages/RoomDetail';
import FurniturePlace from './pages/FurniturePlace'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<RoomList />} />
                <Route path='/write' element={<RoomWrite />} />
                <Route path='/furniture/:urlid' element={<FurniturePlace />} />
                <Route path='/:urlid' element={<RoomDetail />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
