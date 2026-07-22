import React from 'react';
      export async function render(url) {
        return {
          html: "<div>Hello SSR HTML from Server</div>"
        };
      }