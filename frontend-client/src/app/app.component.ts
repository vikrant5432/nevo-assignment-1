import { Component } from '@angular/core';
import { OpportunitiesListComponent } from './features/arbitrage/component/opportunities-list/opportunities-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [OpportunitiesListComponent],
  template: `
    <main>
      <app-opportunities-list></app-opportunities-list>
    </main>
  `,
  styles: [],
})
export class AppComponent {}
