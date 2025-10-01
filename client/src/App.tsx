import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/toast'
import HomePage from './pages/HomePage'
import VendorPage from './pages/VendorPage'   // 👈 make sure this file exists
// import BookingPage from './pages/BookingPage' // 👈 make sure this file exists

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vendor/:id" element={<VendorPage />} />  {/* 👈 this fixes /vendor/3 */}
          {/* <Route path="/booking/:id" element={<BookingPage />} /> */}
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
