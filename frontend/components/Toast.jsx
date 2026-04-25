"use client"

import { useEffect, useState } from "react"

export default function Toast({ message, onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const hide = setTimeout(() => setVisible(false), 2500)
    const remove = setTimeout(() => onClose(), 3200)
    return () => { clearTimeout(hide); clearTimeout(remove) }
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');

       .toast-wrap {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9999;
          pointer-events: none;
        }

        .toast {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #1a1a1a;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 20px;
          padding: 18px 28px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
          transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .toast.show {
          opacity: 1;
        }

        .toast.hide {
          opacity: 0;
          transform: scale(0.95);
        }
      `}</style>

      <div className="toast-wrap">
        <div className={`toast ${visible ? "show" : "hide"}`}>
          <span>🔒</span>
          {message}
        </div>
      </div>
    </>
  )
}