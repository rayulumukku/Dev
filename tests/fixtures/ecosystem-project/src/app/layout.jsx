import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="next-layout border-l-4 border-indigo-500 pl-4 my-4">
      <header className="text-sm text-indigo-400 font-semibold mb-2">Next.js-style Layout Wrapper</header>
      <main>{children}</main>
    </div>
  );
}
