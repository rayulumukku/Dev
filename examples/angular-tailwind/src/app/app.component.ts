import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="p-8 bg-red-950 text-white rounded-xl shadow-2xl">
      <h1 class="text-3xl font-bold mb-4">Tailwind CSS + Angular</h1>
      <p class="text-red-200">Enterprise Angular Standalone Component with Ray Native CSS.</p>
    </div>
  `,
})
export class AppComponent {}
