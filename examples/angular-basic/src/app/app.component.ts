import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div style="font-family: sans-serif; text-align: center; padding: 2rem;">
      <h1>Angular Standalone App with Ray</h1>
      <button (click)="increment()">Count: {{ count }}</button>
    </div>
  `,
})
export class AppComponent {
  count = 0;
  increment() {
    this.count++;
  }
}
