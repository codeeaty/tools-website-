import React from 'react'
import Link from 'next/link'

export const Footer = () => {
  return (
       <footer className="border-t border-white/6 px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400" />
            <span className="font-bold text-white">ToolKit</span>
            <span className="text-white/25 text-sm ml-2">© 2025</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/35">
            <Link href="privacy" className="hover:text-white/70 transition-colors">Privacy</Link>
            <Link href="term" className="hover:text-white/70 transition-colors">Terms</Link>
            <Link href="contact" className="hover:text-white/70 transition-colors">Contact</Link>
            {/* <Link href="" className="hover:text-white/70 transition-colors">Twitter</Link> */}
          </div>
        </div>
      </footer>
  )
}
